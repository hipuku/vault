# Vault — Design Notes

The *why* behind the build: the product intent, the architecture, the design system, and
the non-obvious calls. Written for someone reading the repo cold. Not exhaustive — the
decisions that took a minute of thought are the ones worth recording.

---

## What it is

Vault is an **offline, single-user desktop app for capturing and shaping design tokens** —
colours, fonts, palettes, and type scales. Two jobs:

1. **A library** — capture anything you see in the wild (a hex, a typeface). No project required.
2. **A studio** — gather a project's colours and fonts, then *generate* a palette and a type
   scale from them.

It's deliberately personal software: no accounts, no cloud, no crowd metrics. Everything lives
on disk and works on a plane.

![Colours library](screenshots/colors-library.png)
![Palette creation](screenshots/palette-create-tonal.png)
![Type scale viewer](screenshots/typescale-viewer.png)

> A full visual tour is in [`FEATURE.md`](./FEATURE.md).

---

## Architecture

Electron, three processes, strict boundaries:

```
┌─────────────────────────────────────────────────────────────┐
│ main (Node)                                                  │
│  • better-sqlite3  →  ~/Library/Application Support/vault     │
│  • IPC handlers (colour / font / palette / type-scale / tag) │
│  • Google Fonts metadata fetch, installed-font enumeration,  │
│    font-file storage (copy bytes into userData/fonts/)       │
└───────────────▲──────────────────────────────────────────────┘
                │ contextBridge — one typed `window.api` (VaultApi)
┌───────────────┴──────────────────────────────────────────────┐
│ preload (isolated)  — thin, declarative ipcRenderer.invoke    │
└───────────────▲──────────────────────────────────────────────┘
                │
┌───────────────┴──────────────────────────────────────────────┐
│ renderer (React + CSS Modules)                                │
│  atoms · primitives · domain · pages · hooks · lib            │
└───────────────────────────────────────────────────────────────┘

shared/  — pure, process-agnostic logic (colour maths, tonal/expressive
           generators, type-scale ramp, palette analysis). Imported by
           BOTH main and renderer; no DOM, no Node.
```

- **Context-isolated, no `nodeIntegration`.** The renderer only ever touches the typed
  `VaultApi` surface; all privileged work (DB, filesystem, network) is in main.
- **`shared/` is the spine.** Generators and analysers are pure functions, so the same code
  drives the live preview in the renderer and the persisted result computed in main — no drift.
- **CI** typechecks, lints, and builds on every PR; tagged releases produce a signed, notarised
  `.dmg`.

### Data model

SQLite, one file. `colours`, `fonts`, `palettes` + `swatches`, `type_scales` +
`type_scale_steps`, and a generic `tags` / `asset_tags` join so any asset can belong to
projects. Generated artifacts (palette, type scale) belong to **exactly one** project and
auto-join at creation; vault items (colour, font) belong to **many**.

---

## Design system

- **Tokens first.** Colour, type, spacing, radius, motion, and elevation are CSS custom
  properties. Components never hardcode values (the only literal colours are `#000`/`#fff`
  contrast overlays on swatches, which are intentionally theme-independent).
- **Component taxonomy.** `atoms` (Button, Input, Pill, Badge, Panel, SegmentedControl,
  IconButton, EditableName…) → `primitives` (Toolbar, Drawer, Select, ConfirmDialog,
  EmptyState…) → `domain` (cards, viewers, create flows, modals) → `pages`. Logic lives in
  `hooks`; pure helpers in `lib`.
- **CSS Modules, not Tailwind or inline styles.** Co-located `.module.css` keeps the token
  vocabulary visible and the markup readable; no utility soup, no runtime styling cost.
- **One affordance, learned once.** The same patterns repeat across sections: card =
  whole-card button + hover edit pen + `Pill` (descriptor) + mono (value); viewers are
  hero + `Panel`s; create flows are a two-pane (controls | live preview).

---

## Decisions worth recording

### Platform & stack
- **Electron over Tauri.** Mature native APIs (Font Book access, dialogs, dock) and a single
  language across processes mattered more than binary size for a personal desktop tool.
- **better-sqlite3 over an ORM.** Synchronous, zero-ceremony, and the schema is small enough
  that hand-written SQL is clearer than a query builder.
- **CSS Modules over Tailwind.** A bespoke token system is the point; utilities would hide it.
- **Font Awesome (SVG) over icon-font sets.** Tree-shaken React components, no FOUT.
- **No Storybook.** The app *is* the component gallery; a second harness wasn't earning its keep.

### Colour
- **Perceptual maths (LCH, ΔE2000).** Ramps and "nearest name" run in a perceptual space so
  steps look even and matches read as a human would judge them — not naive RGB distance.
- **Two palette models.** *Tonal* (one seed → semantic ramps) and *Expressive* (several seeds →
  a multi-hue set). Same two-pane create flow, different generator.

### Fonts & type
- **Three sources, app-owned bytes.** Google (CSS link), **installed** (enumerated via
  `system_profiler`, the Font Book set), and file upload. On import the bytes are **copied into
  app storage** so a moved or deleted original never breaks the vault — and the file stays
  shareable (Show in Finder / Download).
- **Type-scale presets, not free-form.** *Product* (Display→Label) and *Web/Markup* (h1–h6 +
  paragraph/small) — chosen at creation like tonal/expressive. The chosen ramp is materialised
  into rows, so there's no schema cost and the "kind" is recoverable from the step names.
- **Units are a reading concern, decoupled from storage.** Sizes persist in px, line-heights as
  unitless multipliers, tracking in em; the viewer converts live (px/rem/pt · unitless/px/% ·
  em/px/%) via one popover, and export captures whatever's selected. "What you see is what you
  ship."

### Interaction
- **Four sections, not tabs.** Colours / Fonts / Palettes / Type scales are peers in a sidebar,
  plus an aggregated per-project view.
- **Drawer for vault items, page for generated artifacts.** A colour or font is a quick glance
  (drawer); a palette or type scale is a worked object (full page with export).
- **Generated artifacts are immutable after creation.** You tune a type scale while creating it
  (hover-edit per step); the viewer is read-only — same stance as palettes, which don't edit
  swatches post-hoc. Hand-tuning past the ratio flips the meta pill to **Custom**.
- **Favourites are a filter, copy feedback is inline, deletes confirm, duplicates warn.** Small
  consistency rules applied everywhere.

---

## Known tradeoffs / next

- **Storage durability.** Data lives in app `userData` — robust against moved files, but not
  backed up. The planned **Phase 2** is an Obsidian-style nominated vault folder (assets +
  data in one portable, sync-able directory).
- **Variable fonts.** Installed-font import reads one weight per face from `system_profiler`;
  variable axes aren't expanded yet.
