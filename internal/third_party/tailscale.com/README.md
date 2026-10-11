# Tailscale utilities

Local copies of `atomicfile` and `jsondb` from
[Tailscale](https://github.com/tailscale/tailscale), adapted for application settings
and server-profile storage. Keeping them local allows these changes without
depending on the Tailscale module. The original upstream revision was not recorded.

- `atomicfile`: Creates parent directories and uses `os.Rename` instead of
  Tailscale's platform-specific rename implementations.
- `jsondb`: Uses the local `atomicfile` package and adds recovery of invalid JSON,
  backing up nonempty files before replacing them with an empty state.
- Tests: Adapted upstream JSON database tests and added project-specific coverage.

Upstream copyright notices and the [BSD 3-Clause License](LICENSE) are retained.
File-level licensing is recorded in the repository's `REUSE.toml`.
