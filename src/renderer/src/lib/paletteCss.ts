import type { Palette, Swatch } from '@shared/types'

function slug(s: string): string {
  return s.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

/** CSS custom-property name for a swatch, e.g. `--ocean-blues-primary` or `--ocean-blues-300`. */
export function swatchVarName(palette: Palette, swatch: Swatch, index: number): string {
  const base = slug(palette.name) || 'palette'
  const label = swatch.label.trim() ? slug(swatch.label) : `${(index + 1) * 100}`
  return `--${base}-${label}`
}

/** Full `:root { … }` custom-properties block for an entire palette. */
export function paletteToCss(palette: Palette, swatches: Swatch[]): string {
  const lines = swatches.map((s, i) => `  ${swatchVarName(palette, s, i)}: ${s.hex};`)
  return `:root {\n${lines.join('\n')}\n}`
}
