import type { Palette, Swatch } from '@shared/types'

function slug(s: string): string {
  return s.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

/** group → stop → hex. Tonal: ramp → stop number. Expressive: colour → light/default/dark. */
export type TokenTree = Record<string, Record<string, string>>

export function buildTokenTree(palette: Palette, swatches: Swatch[], groupNames: Record<string, string>): TokenTree {
  const tree: TokenTree = {}
  for (const s of swatches) {
    const group = palette.kind === 'expressive'
      ? (slug(groupNames[s.group_key] ?? '') || 'hue')
      : (slug(s.group_key) || 'ramp')
    const stop = palette.kind === 'expressive'
      ? (s.label.trim() ? slug(s.label) : 'default')
      : (slug(s.label) || '0')
    ;(tree[group] ??= {})[stop] = s.hex
  }
  return tree
}

function flat(tree: TokenTree): Array<[string, string, string]> {
  const rows: Array<[string, string, string]> = []
  for (const [group, stops] of Object.entries(tree))
    for (const [stop, hex] of Object.entries(stops)) rows.push([group, stop, hex])
  return rows
}

function toCss(tree: TokenTree): string {
  const lines = flat(tree).map(([g, s, hex]) => `  --${g}-${s}: ${hex};`)
  return `:root {\n${lines.join('\n')}\n}`
}

function toScss(tree: TokenTree): string {
  return flat(tree).map(([g, s, hex]) => `$${g}-${s}: ${hex};`).join('\n')
}

function toDesignTokens(tree: TokenTree): string {
  const out: Record<string, Record<string, { $type: 'color'; $value: string }>> = {}
  for (const [group, stops] of Object.entries(tree)) {
    out[group] = {}
    for (const [stop, hex] of Object.entries(stops)) out[group][stop] = { $type: 'color', $value: hex }
  }
  return JSON.stringify(out, null, 2)
}

function toTailwind(tree: TokenTree): string {
  const colours = JSON.stringify(tree, null, 2).replace(/\n/g, '\n      ')
  return `/** @type {import('tailwindcss').Config} */\nmodule.exports = {\n  theme: {\n    extend: {\n      colors: ${colours},\n    },\n  },\n}`
}

export type ExportFormat = 'css' | 'scss' | 'tokens' | 'tailwind'

export const EXPORT_FORMATS: Array<{ id: ExportFormat; label: string; ext: string; hint?: string }> = [
  { id: 'css', label: 'CSS', ext: 'css' },
  { id: 'scss', label: 'SCSS', ext: 'scss' },
  { id: 'tokens', label: 'Design Tokens', ext: 'tokens.json', hint: 'W3C design tokens — import via Tokens Studio in Figma.' },
  { id: 'tailwind', label: 'Tailwind', ext: 'js' },
]

export function exportPalette(format: ExportFormat, palette: Palette, swatches: Swatch[], groupNames: Record<string, string>): string {
  const tree = buildTokenTree(palette, swatches, groupNames)
  switch (format) {
    case 'css':      return toCss(tree)
    case 'scss':     return toScss(tree)
    case 'tokens':   return toDesignTokens(tree)
    case 'tailwind': return toTailwind(tree)
  }
}
