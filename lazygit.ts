import { spawn } from "node:child_process";

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

type Notify = (message: string, type: "warning" | "error") => void;

interface LazygitSessionOptions {
  cwd: string;
  launch: (cwd: string) => Promise<number | null>;
  notify: Notify;
  render: () => void;
  start: () => void;
  stop: () => void;
}

export function launchLazygit(cwd: string): Promise<number | null> {
  return new Promise((resolve, reject) => {
    const child = spawn("lazygit", [], { cwd, stdio: "inherit" });
    child.once("error", reject);
    child.once("close", resolve);
  });
}

export async function runLazygitSession(options: LazygitSessionOptions): Promise<void> {
  options.stop();

  try {
    const exitCode = await options.launch(options.cwd);
    if (exitCode !== 0) {
      const message =
        exitCode === null ? "lazygit was terminated" : `lazygit exited with code ${exitCode}`;
      options.notify(message, "warning");
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    options.notify(`Unable to start lazygit: ${message}`, "error");
  } finally {
    options.start();
    options.render();
  }
}

export function createLazygitExtension(launch = launchLazygit): (pi: ExtensionAPI) => void {
  return (pi) => {
    pi.registerCommand("lazygit", {
      description: "Open lazygit in the current working directory",
      handler: async (_args, ctx) => {
        if (ctx.mode !== "tui") {
          ctx.ui.notify("lazygit requires Pi's interactive TUI", "error");
          return;
        }

        await ctx.ui.custom<void>(async (tui, _theme, _keybindings, done) => {
          await runLazygitSession({
            cwd: ctx.cwd,
            launch,
            notify: (message, type) => ctx.ui.notify(message, type),
            render: () => tui.requestRender(true),
            start: () => tui.start(),
            stop: () => tui.stop(),
          });
          done();
          return { render: () => [], invalidate: () => {} };
        });
      },
    });
  };
}

export default createLazygitExtension();
