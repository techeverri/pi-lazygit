import assert from "node:assert/strict";
import test from "node:test";

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

import { createLazygitExtension, runLazygitSession } from "../lazygit.ts";

test("registers the lazygit command", () => {
  type Command = Parameters<ExtensionAPI["registerCommand"]>[1];
  let registered: { name: string; command: Command } | undefined;
  const pi = {
    registerCommand(name: string, command: Command) {
      registered = { name, command };
    },
  } satisfies Pick<ExtensionAPI, "registerCommand">;

  createLazygitExtension()(pi as ExtensionAPI);

  assert.equal(registered?.name, "lazygit");
  assert.equal(registered?.command.description, "Open lazygit in the current working directory");
});

test("runs lazygit in the working directory and restores the terminal", async () => {
  const events: string[] = [];

  await runLazygitSession({
    cwd: "/worktree",
    launch: async (cwd) => {
      events.push(`launch:${cwd}`);
      return 0;
    },
    notify: () => assert.fail("successful exits should not notify"),
    render: () => events.push("render"),
    start: () => events.push("start"),
    stop: () => events.push("stop"),
  });

  assert.deepEqual(events, ["stop", "launch:/worktree", "start", "render"]);
});

test("restores the terminal and reports a failed exit", async () => {
  const events: string[] = [];

  await runLazygitSession({
    cwd: "/worktree",
    launch: async () => 2,
    notify: (message, type) => events.push(`${type}:${message}`),
    render: () => events.push("render"),
    start: () => events.push("start"),
    stop: () => events.push("stop"),
  });

  assert.deepEqual(events, ["stop", "warning:lazygit exited with code 2", "start", "render"]);
});

test("restores the terminal when lazygit cannot start", async () => {
  const events: string[] = [];

  await runLazygitSession({
    cwd: "/worktree",
    launch: async () => {
      throw new Error("spawn lazygit ENOENT");
    },
    notify: (message, type) => events.push(`${type}:${message}`),
    render: () => events.push("render"),
    start: () => events.push("start"),
    stop: () => events.push("stop"),
  });

  assert.deepEqual(events, [
    "stop",
    "error:Unable to start lazygit: spawn lazygit ENOENT",
    "start",
    "render",
  ]);
});
