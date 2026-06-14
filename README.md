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

Everything is local. No accounts, no cloud.

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
| `npm run lint` | ESLint (typescript-eslint + react-hooks) |
| `npm run format` | Prettier write |
| `npm run build` | Production build |
| `npm run dist:mac` | Signed/notarised `.dmg` |

## More

- [`FEATURE.md`](./FEATURE.md) — a visual tour of every feature.
- [`DESIGN.md`](./DESIGN.md) — architecture, the design system, and the decisions behind the build.

## Stack

Electron · React · TypeScript · CSS Modules · better-sqlite3 · electron-vite
