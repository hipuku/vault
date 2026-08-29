# Vault: Features

A visual tour of what Vault does. There are four asset types, **colours, fonts, palettes and type
scales**, each of them a library you capture into and a studio you generate from, tied together by
**projects**.

---

## Colours

Capture hexes into a searchable library. Every colour is auto-named, carries a perceptual
lightness ramp (revealed on hover), and shows its hue family + value.

![Colours library](screenshots/colors-library.png)

**Filter and sort** by hue family, favourites, or project, using the same compact filter idiom used
across the app.

![Colours: filters](screenshots/colors-filters.png)
![Colours: favourites](screenshots/colors-favourites.png)

**Add a colour** from a hex (or pasted value)…

![Add colour from hex](screenshots/color-add-hex.png)

…or **extract from an image**. Vault buckets the dominant colours and flags near-identical
picks so you only keep distinct ones.

![Add colour from image](screenshots/color-add-image.png)
![Add colour from image: de-duplicated](screenshots/color-add-image-clean.png)

**Viewer.** The full lightness scale, contrast checks, and project membership in a drawer.

![Colour viewer](screenshots/color-viewer.png)

Empty states guide the first capture.

![Colours: empty state](screenshots/colors-empty.png)

---

## Fonts

Add fonts from three sources. Installed fonts and local uploads are copied into app storage,
so the vault owns the bytes; a Google font is stored as a reference and rendered from
Google's CDN, with `Download` fetching the file on demand.

**Google Fonts.** Search the catalogue, preview in place, add in a click.

![Import font: Google](screenshots/fonts-import-google.png)

**Installed fonts.** Pick straight from your Mac's Font Book, enumerated natively.

![Import font: installed](screenshots/fonts-import-installed.png)

**Local upload.** Drop files, then map each to a weight and style under one family.

![Import font: local upload](screenshots/fonts-import-local.png)

The **library** previews every family at a size you control…

![Fonts library](screenshots/fonts-library.png)

…and the **viewer** specimens each weight, with copy-ready CSS and a way to grab the file back
out (Show in Finder / Download).

![Font viewer](screenshots/font-viewer.png)

---

## Palettes

Generate a palette from your library colours, two ways.

**Tonal.** One seed expands into semantic ramps: primary, neutral, status.

![Palette creation: tonal](screenshots/palette-create-tonal.png)

**Expressive.** Several seeds compose a multi-hue set.

![Palette creation: expressive](screenshots/palette-create-expressive.png)

The **viewer** shows the full palette with quality badges; any swatch can be **promoted back
into your colour library**.

![Palette viewer](screenshots/palette-viewer.png)
![Palette: promote swatch to library](screenshots/palette-promote-swatch.png)

**Export** to CSS, SCSS, Design Tokens (Figma), or Tailwind.

![Palette export](screenshots/palette-export.png)

---

## Type scales

Generate a type scale on a modular ratio, in two flavours.

**Product.** Display down to Label, the design-system role set.

![Type scale creation: product](screenshots/typescale-create-product.png)

**Web / Markup.** h1 to h6 plus paragraph and small, mapped to HTML tags.

![Type scale creation: web](screenshots/typescale-create-web.png)

The **viewer** is specimen-forward: a glyph hero, live **unit conversion** (px / rem / pt ·
unitless / px / % · em), and per-row metrics. Export captures whatever units are selected.

![Type scale viewer](screenshots/typescale-viewer.png)

---

## Projects

Tag any asset into a project, then see **everything** for that project, palettes and type scales
and colours and fonts, in one aggregated view.

![Add a project](screenshots/project-add.png)
![Project view](screenshots/project-view.png)

---

## Command palette

Press **⌘K** anywhere to jump to a section or project, or start a new colour, font, palette, or
type scale, all without leaving the keyboard. Start typing to search your library too: existing
**colours**, **fonts**, and **projects** match by name (colours show a swatch), and picking one
opens it. Results are ranked by a fuzzy matcher; **↑/↓** to move, **⏎** to run, **Esc** to dismiss.
