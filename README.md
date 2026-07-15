# Vault

An offline, single-user desktop app for capturing and shaping design tokens — **colours,
fonts, palettes, and type scales** — built with Electron, React, and SQLite.

![Vault](screenshots/colors-library.png)

## Features

- **Colours** — capture hexes, auto-named, with perceptual ramps and contrast checks.
- **Fonts** — add from Google Fonts, your installed fonts (Font Book), or a file; preview at
  any size; grab the file back out.
- **Palettes** — generate tonal systems or expressive multi-hue sets from your library, then
  export (CSS / SCSS / Design Tokens / Tailwind).
- **Type scales** — Product or Web/Markup presets on a ratio, live unit conversion
  (px / rem / pt …), per-step tuning, and the same four export formats.
- **Projects** — tag any asset; view everything for a project in one place.
- **Command palette** — `⌘K` to jump to any section or project, or start a new asset, without
  leaving the keyboard.

Everything is local. No accounts, no cloud. Your library lives in
`~/Library/Application Support/Vault/` (SQLite database + copied font files) and never
leaves your machine.

## Engineering highlights

- **Two-tier OKLCH token system.** Raw primitives → semantic intent aliases, layered with
  native CSS `@layer`; perceptual colour ramps, relative-colour syntax (`oklch(from … )`), and
  full space / radius / shadow / z-index / motion scales. Components never hardcode values.
- **One source of truth across processes.** `shared/` holds pure, DOM- and Node-free logic —
  colour maths, tonal/expressive palette generators, the type-scale ramp — imported by **both**
  main and renderer. The live preview and the persisted result run identical code, so they can't
  drift.
- **Perceptual colour throughout.** "Nearest name" is a two-pass CIE76 → CIEDE2000 search over a
  ~31,900-name dataset; ramps, grouping, and contrast all reason in perceptual space (LCH/OKLCH),
  not RGB distance.
- **Typed IPC boundary.** A context-isolated renderer (no `nodeIntegration`) reaches Node only
  through a single typed `window.api` (`VaultApi`) surface; all DB, filesystem, and network work
  lives in main.
- **Tested logic, gated in CI.** 86 Vitest unit tests over the pure `lib/` functions (generators,
  exporters, colour maths) run alongside lint + typecheck on every push.
- **Local-first by construction.** Synchronous better-sqlite3 + font bytes copied into `userData`;
  the app works fully offline.

## Install

Vault is a direct-download Mac app — not on the App Store, no account required.

1. Download the `.dmg` for your Mac from [Releases](../../releases): `Vault-<version>-arm64.dmg`
   for Apple Silicon, `Vault-<version>.dmg` for Intel.
2. Open it and drag **Vault** into Applications.
3. **First launch only.** The build is unsigned, so macOS quarantines it on download.
   Clear the quarantine once:

   ```bash
   xattr -cr /Applications/Vault.app
   ```

   Then open Vault normally. (Right-click → Open also works on some macOS versions.)

## Develop

```bash
npm install      # rebuilds better-sqlite3 for Electron via postinstall
npm run dev      # launch the app with HMR
```

## Scripts

| Command | Does |
|---|---|
| `npm run dev` | Run the app (electron-vite, HMR) |
| `npm run typecheck` | `tsc --noEmit` across main + renderer |
| `npm run test` | Vitest (watch) over the pure `lib/` logic |
| `npm run test:run` | Vitest once (CI) |
| `npm run lint` | ESLint (typescript-eslint + react-hooks) |
| `npm run format` | Prettier write |
| `npm run build` | Production build |
| `npm run dist:mac` | Unsigned `.dmg` (arm64 + Intel) |

## More

- [`FEATURE.md`](./FEATURE.md) — a visual tour of every feature.
- [`DESIGN.md`](./DESIGN.md) — architecture, the design system, and the decisions behind the build.

## Stack

Electron · React · TypeScript · CSS Modules · better-sqlite3 · electron-vite
