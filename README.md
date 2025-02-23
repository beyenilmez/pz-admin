# PZ Admin

**PZ Admin** is a Windows and Linux desktop application for managing Project Zomboid servers with RCON.

## Installation

Download from the [website](https://beyenilmez.github.io/pz-admin) or go to [the releases page](https://github.com/beyenilmez/pz-admin/releases/latest) and download the matching binary for your platform.
Windows(amd64, arm64) and Linux(amd64) are supported.

## Table of Contents

- [Screenshots](#screenshots)
- [Features](#features)
- [Development](#development)
- [Frontend Scripts](#frontend-scripts)
- [Technologies](#technologies)
- [License](#license)

## Screenshots

> Expand the section below to view screenshots.

<details>
<summary>Click to view screenshots</summary>

*Manage your server.*
![Management Tab](./assets/management.webp)

*View and manage your players.*
![Player List Tab](./assets/players.webp)

*Modify and save server options.*
![Options Tab](./assets/options.webp)

*Interact with your server directly via an RCON terminal.*
![Terminal Tab](./assets/terminal.webp)


*Spawn vehicles with a catalog.*
![Add Vehicle Dialog](./assets/add_vehicle.webp)

*Add items with an item catalog.*
![Add Items Dialog](./assets/add_items.webp)

*Add xp to players with custom skills and levels.*
![Add XP Dialog](./assets/add_xp.webp)

*Set player access level.*
![Set Access Level Dialog](./assets/set_access_level.webp)


*Message Editor*
![Message Editor](./assets/message_editor.webp)

*Item Browser*
![Item Browser](./assets/item_browser.webp)

*Vehicle Browser*
![Vehicle Browser](./assets/vehicle_browser.webp)

</details>

## Features

### Server Management
- RCON terminal for remote console access.
- Modify, import, and export server options.
- Save world, stop server.
- Send server-wide messages.
- Weather controls: Start/stop rain and weather.
- Trigger random events like choppers, gunshots, lightning, and thunder.

### Player Management
- View and manage player list.
- Add XP, items, or vehicles to players.
- Adjust access levels, ban/unban, kick, or teleport players.
- Add/remove players to/from the whitelist.
- Create hordes, lightning or thunder on specific players.

### Tools
- Message editor, item browser and vehicle browser available as standalone tools.

## Development

### Pre-requisites

Before starting development, ensure you have the following installed:

1. **Install NodeJS:** [NodeJS installation guide](https://nodejs.org/en/download/).
2. **Install Yarn:** [Yarn installation guide](https://classic.yarnpkg.com/lang/en/docs/install/).
3. **Install Go:** [Go installation guide](https://go.dev/doc/install).
4. **Install Wails:** [Wails installation guide](https://wails.io/docs/gettingstarted/installation).

### Development or Building

1. **Clone the repository:**
   ```bash
   git clone https://github.com/beyenilmez/pz-admin.git
   ```
2. **Navigate to the project directory:**
   ```bash
   cd pz-admin
   ```
3. **Run in dev mode:**

   ```bash
   wails dev
   ```

   **or build the application:**

   ```bash
   wails build
   ```

## Frontend Scripts

- **`yarn vehicles`:** Updates the `src/assets/vehicles.json` file with the new vehicles from `public/vehicles` folder.
- **`yarn items`:** Downloads item images to `public/items` and updates the `src/assets/items.json` file.
- **`yarn convert-item-translations:`** Converts translations for items into JSON.

    Usage: `yarn convert-item-translations {lang} {encoding}`

    Example: `game-translations/{lang}.txt` → `public/locales/{lang}/items.json`.

    Item translation files are located in: `C:\Program Files (x86)\Steam\steamapps\common\ProjectZomboid\media\lua\shared\Translate\{lang}\ItemName_{lang}.txt`

## Technologies

- **Backend**: [Go](https://go.dev/), [Wails](https://wails.io/), [RCON](https://github.com/gorcon/rcon)
- **Frontend**: [React](https://react.dev/), [TailwindCSS](https://tailwindcss.com/), [shadcnUI](https://ui.shadcn.com/)
- **Translation**: [i18next](https://react.i18next.com/)

## License

Distributed under the MIT License. See [LICENSE](https://github.com/beyenilmez/pz-admin/blob/main/LICENSE) for more information.
