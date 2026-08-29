import type { ExportFormatDef } from '../organisms/ExportModal/ExportModal'
import { type TypeUnits, formatSize, formatLineHeight, formatTracking } from './typeUnits'

interface StepLike {
  step_name: string
  size: number
  weight: number
  line_height: string
  letter_spacing: string
}

function slug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

export type TypeExportFormat = 'css' | 'scss' | 'tokens' | 'tailwind'

export const TYPE_EXPORT_FORMATS: ExportFormatDef[] = [
  { id: 'css', label: 'CSS', ext: 'css' },
  { id: 'scss', label: 'SCSS', ext: 'scss' },
  { id: 'tokens', label: 'Design Tokens', ext: 'tokens.json', hint: 'W3C typography tokens — import via Tokens Studio in Figma.' },
  { id: 'tailwind', label: 'Tailwind', ext: 'js' },
]

// Each step's values formatted in the table's currently-selected units. Weight
// stays numeric (a CSS/token weight is always a number).
interface Formatted { key: string; size: string; weight: number; leading: string; tracking: string }

function formatRows(steps: StepLike[], units: TypeUnits): Formatted[] {
  return steps.map(s => ({
    key: slug(s.step_name),
    size: formatSize(s.size, units.size),
    weight: s.weight,
    leading: formatLineHeight(s.line_height, s.size, units.lineHeight),
    tracking: formatTracking(s.letter_spacing, s.size, units.tracking, true),
  }))
}

function toCss(rows: Formatted[]): string {
  const lines = rows.flatMap(r => [
    `  --type-${r.key}-size: ${r.size};`,
    `  --type-${r.key}-weight: ${r.weight};`,
    `  --type-${r.key}-leading: ${r.leading};`,
    `  --type-${r.key}-tracking: ${r.tracking};`,
  ])
  return `:root {\n${lines.join('\n')}\n}`
}

function toScss(rows: Formatted[]): string {
  return rows.flatMap(r => [
    `$type-${r.key}-size: ${r.size};`,
    `$type-${r.key}-weight: ${r.weight};`,
    `$type-${r.key}-leading: ${r.leading};`,
    `$type-${r.key}-tracking: ${r.tracking};`,
  ]).join('\n')
}

function toDesignTokens(rows: Formatted[]): string {
  const out: Record<string, unknown> = {}
  for (const r of rows) {
    out[r.key] = {
      $type: 'typography',
      $value: { fontSize: r.size, fontWeight: r.weight, lineHeight: r.leading, letterSpacing: r.tracking },
    }
  }
  return JSON.stringify(out, null, 2)
}

function toTailwind(rows: Formatted[]): string {
  const entries = rows.map(r =>
    `        '${r.key}': ['${r.size}', { lineHeight: '${r.leading}', letterSpacing: '${r.tracking}', fontWeight: '${r.weight}' }],`
  )
  return [
    `/** @type {import('tailwindcss').Config} */`,
    `module.exports = {`,
    `  theme: {`,
    `    extend: {`,
    `      fontSize: {`,
    ...entries,
    `      },`,
    `    },`,
    `  },`,
    `}`,
  ].join('\n')
}

export function exportTypeScale(format: string, steps: StepLike[], units: TypeUnits): string {
  const rows = formatRows(steps, units)
  switch (format) {
    case 'css':      return toCss(rows)
    case 'scss':     return toScss(rows)
    case 'tokens':   return toDesignTokens(rows)
    case 'tailwind': return toTailwind(rows)
    default:         return ''
  }
}
