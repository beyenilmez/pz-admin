# Flatpak

Requires Linux, Flatpak, tar, mise-managed tools, and network access.

```sh
wails3 task linux:flatpak:setup        # Install SDKs and build tools
wails3 task linux:create:flatpak       # Build bin/pz-admin.flatpak
wails3 task linux:flatpak:install:run  # Install and launch
wails3 task linux:flatpak:check        # Build and run Flathub checks
```

Local builds include working changes. Use `PINNED=true` to build the current commit
available from `origin`. For releases, also set `RELEASE_TAG=v2.0.0`.

Local and CI checks exempt the domain reachability check blocked by Cloudflare.
