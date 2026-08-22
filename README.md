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
  colour maths, the palette generators, the type-scale ramp, palette analysis. The palette
  generators are imported by **both** main and renderer: the renderer previews with them and
  main re-runs them from the seed before writing, so the saved palette and the previewed one
  can't drift. Type scales take the other route — the renderer materialises the steps and main
  only persists the rows — so there the shared module is shared across the renderer's own
  create flow, viewer and card rather than across processes.
- **Perceptual colour throughout.** "Nearest name" is a two-pass CIE76 → CIEDE2000 search over a
  ~31,900-name dataset; ramps, grouping, and contrast all reason in perceptual space (LCH/OKLCH),
  not RGB distance.
- **Typed IPC boundary.** A context-isolated renderer (no `nodeIntegration`) reaches Node only
  through a single typed `window.api` (`VaultApi`) surface; all DB, filesystem, and network work
  lives in main.
- **Tested logic, gated in CI.** 99 Vitest unit tests over the pure `lib/` functions (generators,
  exporters, colour maths) run alongside lint + typecheck on every push.
- **Local-first by construction.** Synchronous better-sqlite3 + font bytes copied into `userData`;
  the app works fully offline.

## Architecture

Three processes, one typed boundary, and a pure core shared across it.

```
 renderer · Chromium — React, CSS Modules
┌─────────────────────────────────────────────────────────────────────┐
│  contextIsolation: true          nodeIntegration: false             │
│                                                                     │
│  No require. No fs. No net. No database handle. The renderer        │
│  cannot reach Node even if a dependency tries to.                   │
│                                                                     │
│  It reaches privilege through exactly one object:                   │
│                                                                     │
│                     window.api : VaultApi                           │
└────────────────────────────────┬────────────────────────────────────┘
                                 │  typed method calls
                                 │  the only way across
 preload · the bridge            ▼
┌─────────────────────────────────────────────────────────────────────┐
│  contextBridge.exposeInMainWorld('api', api)                        │
│                                                                     │
│  Every method is one line: an ipcRenderer.invoke(channel, …).       │
│  No logic, no state, no shortcuts. A typed switchboard and          │
│  nothing else, so the whole attack surface is one readable file.    │
└────────────────────────────────┬────────────────────────────────────┘
                                 │  ipcRenderer.invoke ⇄ ipcMain.handle
                                 │  request/response, namespaced channels:
                                 │
                                 │    colour:      palette:     tag:
                                 │    font:        swatch:      clipboard:
                                 │    type-scale:  type-scale-step:
 main · Node                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Owns everything privileged. Nothing here is reachable directly.    │
│                                                                     │
│   db/     better-sqlite3, synchronous, five query modules           │
│           colour · font · palette · tag · type-scale                │
│                                                                     │
│   lib/    fontStorage      copies font bytes into userData          │
│           googleFonts      the Google Fonts metadata catalogue      │
│           installedFonts   reads the system's installed families    │
└─────────────────────────────────────────────────────────────────────┘

 shared/ · pure — no DOM, no Node, no Electron
┌─────────────────────────────────────────────────────────────────────┐
│  Colour maths, the palette generators, the type-scale ramp,         │
│  palette analysis, and the VaultApi types themselves.               │
│                                                                     │
│  Imported by main AND renderer. This is the one module both         │
│  sides are allowed to agree on.                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Why the renderer is powerless by construction.** `nodeIntegration: false` means renderer code
has no `require`, and `contextIsolation: true` runs the preload script in a separate JavaScript
world from the page. The renderer cannot read the preload's scope, reach into `ipcRenderer`
directly, or monkey-patch its way to Node. It sees `window.api` and nothing more. Every database
write, file read, and network request in Vault happens on the far side of that boundary.

**`sandbox: false` is a deliberate trade-off.** It lets the preload script use Node built-ins
directly, which is what keeps the bridge a single flat file instead of a second IPC hop. Context
isolation still stands, so the renderer remains cut off from Node; the concession is that the
preload script itself is privileged. That is why it holds no logic. It is auditable in one read,
and every method on it is a forwarding call whose entire body is visible on one line.

**Why `shared/` is imported by both processes.** The palette generators run in two places on
purpose. The renderer runs them to preview a palette live, and main re-runs them from the same
seed before writing to SQLite. The saved palette and the previewed one therefore cannot drift,
because they are the same function over the same input rather than two implementations that
happen to agree today.

Type scales take the other route: the renderer materialises the steps and main only persists the
rows. There, `shared/` is shared across the renderer's own create flow, viewer and card rather
than across the process boundary. The rule is not "share everything", it is "share the thing
whose disagreement would be a bug".

**All outbound traffic is Google Fonts, and there are exactly two calls.** `googleFonts` fetches
the metadata catalogue, and the `font:download-google` handler resolves a family's CSS and then
its `.woff2` bytes. Both are user-initiated, both hit `fonts.google.com` or `fonts.googleapis.com` and nothing else, and
neither runs unless you go looking for a font. There is no telemetry, no account check, and no
update ping. Everything else in Vault, including the entire library, is local by construction.

**The one call that is not IPC.** `getPathForFile` is a direct `webUtils` call in the preload,
not an `invoke`. Electron's file objects no longer expose a filesystem path to the renderer, so
this resolves a dropped `File` to its real path on the privileged side and hands back a string.
It reads from the drop event, never from arbitrary renderer input.

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
