# Vault

An offline, single-user desktop app for capturing and shaping design tokens: colours, fonts,
palettes, and type scales. Built with Electron, React, and SQLite.

![Vault](screenshots/colors-library.png)

## Features

- **Colours.** Capture hexes, auto-named, with perceptual ramps and contrast checks.
- **Fonts.** Add from Google Fonts, your installed fonts (Font Book), or a file; preview at any
  size; grab the file back out.
- **Palettes.** Generate tonal systems or expressive multi-hue sets from your library, then
  export to CSS, SCSS, Design Tokens or Tailwind.
- **Type scales.** Product or Web/Markup presets on a ratio, live unit conversion (px, rem, pt
  and the rest), per-step tuning, and the same four export formats.
- **Projects.** Tag any asset, then view everything for a project in one place.
- **Command palette.** `⌘K` to jump to any section or project, or start a new asset, without
  leaving the keyboard.

Everything is local. There are no accounts and no cloud. Your library lives in
`~/Library/Application Support/Vault/`, as a SQLite database plus copied font files, and never
leaves your machine. The one exception is Google Fonts: adding or previewing a font from Google
fetches it. [`DESIGN.md`](./DESIGN.md) lists every request.

## Install

Vault is a direct download for macOS. It is not on the App Store and needs no account.

1. Download the `.dmg` for your Mac from [Releases](../../releases). `Vault-<version>-arm64.dmg`
   is for Apple Silicon, `Vault-<version>.dmg` for Intel.
2. Open it and drag **Vault** into Applications.
3. **First launch only.** The build is unsigned, so macOS quarantines it on download. Clear the
   quarantine once:

   ```bash
   xattr -cr /Applications/Vault.app
   ```

   Then open Vault normally. Right-click, then Open, also works on some macOS versions.

## Develop

Node 22 or newer, as `.nvmrc` and the `engines` field both say. Electron 44 and the SQLite
driver each require it.

```bash
nvm use
npm install      # postinstall fetches the Electron binary
npm run dev      # launch the app with HMR
```

## Scripts

| Command             | Does                                      |
| ------------------- | ----------------------------------------- |
| `npm run dev`       | Run the app (electron-vite, HMR)          |
| `npm run typecheck` | `tsc --noEmit` across main and renderer   |
| `npm run test`      | Vitest (watch): the pure `lib/` logic in node, the components in jsdom |
| `npm run test:run`  | Vitest once (CI)                          |
| `npm run lint`      | ESLint (typescript-eslint + react-hooks)  |
| `npm run format`    | Prettier write                            |
| `npm run build`     | Production build                          |
| `npm run dist:mac`  | Unsigned `.dmg` (arm64 and Intel)         |

## More

- [`FEATURE.md`](./FEATURE.md) is a visual tour of every feature.
- [`DESIGN.md`](./DESIGN.md) covers the architecture, the design system, and the decisions
  behind the build.

## Stack

Electron · React · TypeScript · CSS Modules · better-sqlite3 · electron-vite ·
`haus-colour-utils` · `haus-colour-names`
