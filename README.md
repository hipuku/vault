# Vault

An offline, single-user Mac app for capturing and shaping design tokens: colours, fonts, palettes
and type scales. It is a library for saved colours and fonts, and a studio that generates palettes and type scales
from a project's colours and fonts. Everything stays on the machine: the library in a SQLite
database and imported font files in the app's data folder, both under
`~/Library/Application Support/vault`. The only network traffic is to Google Fonts, when the font
adder opens, a Google font is shown, or its files are downloaded.

![Vault's colour library: a grid of named swatches, each with its hue family and hex](screenshots/colors-library.png)

[![Case study on hipuku.dev](https://img.shields.io/badge/Case_study-hipuku.dev-AA1155?style=for-the-badge)](https://www.hipuku.dev/work/vault)
[![Download the latest release for macOS](https://img.shields.io/github/v/release/hipuku/vault?label=Download&logo=apple&logoColor=white&color=AA1155&style=for-the-badge)](../../releases/latest)
[![Figma files](https://img.shields.io/badge/Figma-5_files-AA1155?logo=figma&logoColor=white&style=for-the-badge)](https://www.figma.com/@hipuku)

## At a glance

- **Designed and built end to end.** Five Figma files hold the tokens, the 49 components and the
  screens, and every component has the same name in Figma and in code.
  [`DESIGN.md` § Components](./DESIGN.md#components)
- **Built on a design system.** Every colour, type and spacing value comes from the haus token
  layer; the components are vault's own, in three tiers.
  [`DESIGN.md` § Tokens](./DESIGN.md#tokens)
- **Accessible.** Atoms and molecules follow the WAI-ARIA pattern for their role, and axe runs in
  20 of the 22 component test files. [`DESIGN.md` § Accessibility](./DESIGN.md#accessibility)
- **Enforced.** Stylelint fails any colour, type, spacing, radius or z-index written as a raw
  value. [`DESIGN.md` § Enforcement](./DESIGN.md#enforcement)
- **Perceptual colour.** Names, ramps and palettes are computed in a perceptual space, with
  CIEDE2000 as the distance. [`ARCHITECTURE.md` § Colour naming](./ARCHITECTURE.md#colour-naming)
- **Sandboxed and tested.** The renderer runs sandboxed and reaches data only through typed IPC;
  308 unit and component tests, and an end-to-end suite on the built app.
  [`ARCHITECTURE.md` § Boundaries and security](./ARCHITECTURE.md#boundaries-and-security)

## Documentation

| File                                   | Covers                                                                  |
| -------------------------------------- | ----------------------------------------------------------------------- |
| [`FEATURE.md`](./FEATURE.md)           | Every feature, screen by screen                                         |
| [`DESIGN.md`](./DESIGN.md)             | Visual language, typography, interaction and the design system          |
| [`ARCHITECTURE.md`](./ARCHITECTURE.md) | Processes, data model, security, the colour and type maths, and testing |

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

Node 22 or newer, as `.nvmrc` and the `engines` field both say. Electron 45 and the SQLite driver
each require it.

```bash
nvm use
npm install      # postinstall fetches the Electron binary
npm run dev      # launch the app with HMR
```

## Scripts

| Command             | Does                                                                   |
| ------------------- | ---------------------------------------------------------------------- |
| `npm run dev`       | Run the app (electron-vite, HMR)                                       |
| `npm run typecheck` | `tsc --noEmit` across main and renderer                                |
| `npm run test`      | Vitest (watch): the pure `lib/` logic in node, the components in jsdom |
| `npm run test:run`  | Vitest once (CI)                                                       |
| `npm run e2e`       | Playwright against the built app (run `npm run build` first)           |
| `npm run lint`      | ESLint (typescript-eslint + react-hooks)                               |
| `npm run lint:css`  | Stylelint, including the raw-value gate                                |
| `npm run format`    | Prettier write                                                         |
| `npm run build`     | Production build                                                       |
| `npm run dist:mac`  | Unsigned `.dmg` (arm64 and Intel)                                      |

## Stack

Electron · React · TypeScript · CSS Modules · better-sqlite3 · electron-vite · chroma-js · culori ·
`haus-tokens` · `haus-colour-utils` · `haus-colour-names`
