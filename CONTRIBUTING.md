# Contributing

Code, documentation, and translation contributions are welcome. Discuss larger
changes in an [issue](https://github.com/beyenilmez/pz-admin/issues) first.

## Pull requests

Before opening a PR, run:

```sh
wails3 task format
wails3 task check
```

Use [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/)
for PR titles, such as `fix: correct vehicle sorting` or
`feat: add player filtering`. CI validates titles; individual commits do not
need this format because PRs are squash merged.

Describe the behavior change and how you tested it. Include screenshots for UI
changes and note platform-specific checks you could not run.

## Development

PZ Admin uses Go and Wails v3 with React, TypeScript, and Mantine.
Run commands from the repository root.

### Setup

Install and activate [mise](https://mise.jdx.dev/), then run:

```sh
mise trust
mise install
wails3 doctor
```

[mise.toml](mise.toml) pins the tools and keeps the Wails CLI aligned with
[go.mod](go.mod). Native GUI libraries and platform SDKs must be installed
separately; see the [Wails prerequisites](https://v3.wails.io/getting-started/installation/).
This project uses GTK4 and WebKitGTK 6.0 on Linux.

On Ubuntu 24.04 / Debian 13, install the build dependencies and metadata validators:

```sh
sudo apt install build-essential pkg-config libgtk-4-dev libwebkitgtk-6.0-dev appstream desktop-file-utils
```

On Fedora:

```sh
sudo dnf install gcc gcc-c++ make pkgconf-pkg-config gtk4-devel webkitgtk6.0-devel appstream desktop-file-utils
```

### Workflows

| Command                         | Purpose                                                                                          |
| ------------------------------- | ------------------------------------------------------------------------------------------------ |
| `wails3 dev`                    | Run the desktop app with frontend reloads and backend rebuilds.                                  |
| `wails3 task format`            | Format Go, translations, and Prettier-supported files across the repository.                     |
| `wails3 task check`             | Check Go modules, formatting, lint, types, translations, tests, platform metadata, and licenses. |
| `wails3 task test`              | Run backend and frontend tests.                                                                  |
| `pnpm --dir frontend test`      | Run frontend tests in watch mode.                                                                |
| `pnpm --dir frontend storybook` | Preview UI with mocked services at `http://127.0.0.1:6006`.                                      |
| `wails3 build`                  | Build for the host platform into `bin/`.                                                         |
| `wails3 package`                | Build and package for the host platform into `bin/`.                                             |
| `wails3 task check:licenses`    | Check REUSE license information.                                                                 |

### Website

The website provides downloads and browser versions of the three tools, reusing
the desktop app’s components and assets. It runs without Wails.

```sh
pnpm --dir frontend install --frozen-lockfile
pnpm --dir frontend website:dev
```

Use `website:build` and `website:preview` in place of `website:dev` to build and preview production output.

The [website workflow](.github/workflows/website.yml) deploys `main` to
<https://beyenilmez.github.io/pz-admin/>.

### Project structure

Wails connects the Go backend to the React interface through generated TypeScript
bindings.

- `main.go`: Starts the desktop application and registers backend services.
- `internal/`: Communicates with game servers and manages application data.
- `frontend/src/`: React interface, organized into the application shell (`app/`),
  individual features (`features/`), and reusable components and utilities (`shared/`).
- `frontend/src/i18n/`: Interface translations and language configuration; see the
  [translation guide](frontend/src/i18n/README.md).
- `frontend/src/data/`: Item, vehicle, skill, and server-option catalogs used by the interface.
- `frontend/bindings/`: Generated code that lets the interface call Go services.
- `scripts/` and `frontend/scripts/`: Tools for generating data and assets, validating metadata,
  and supporting releases; see [project scripts](scripts/README.md) and
  [frontend scripts](frontend/scripts/README.md).
- `build/`: Platform-specific build tasks, package definitions, and desktop integration files.

After changing exported Go service APIs, regenerate the tracked bindings:

```sh
wails3 task common:generate:bindings
```

For screenshots, use the [screenshot workflow](assets/screenshots/README.md).

Retain license information for new dependencies and assets; see
[REUSE.toml](REUSE.toml) and [asset attribution](frontend/public/README.md).

Packaging details: [Flatpak](build/linux/flatpak/README.md),
[AppImage](build/linux/appimage/README.md), and [AUR](build/linux/aur/README.md).
