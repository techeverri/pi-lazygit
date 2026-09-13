# Repository Guidance

- Use the Node version in `mise.toml` and npm.
- Keep the extension single-file unless additional structure is necessary.
- Add or update tests for behavior changes and run `npm run check`.
- Use Conventional Commits. `feat:` releases a minor version; `fix:` and `perf:` release a patch version; `BREAKING CHANGE:` releases a major version. Other commit types do not release by default.
- Do not bump versions or create release tags manually; semantic-release handles both from `main`.
