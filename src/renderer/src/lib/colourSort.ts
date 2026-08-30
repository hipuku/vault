import { converter } from 'culori'
import { HUE_FAMILIES, hueFamily as hausHueFamily } from 'haus-colour-utils'
import type { Colour } from '@shared/types'
import { prefersDarkText } from './colour'

const toOklch = converter('oklch')

export type SortKey = 'recent' | 'name'
export type GroupKey = 'none' | 'hue' | 'lightness' | 'contrast'

export const SORT_OPTIONS: Array<{ key: SortKey; label: string }> = [
  { key: 'recent', label: 'Recently added' },
  { key: 'name', label: 'Name (A–Z)' },
]

export const GROUP_OPTIONS: Array<{ key: GroupKey; label: string }> = [
  { key: 'none', label: 'No grouping' },
  { key: 'hue', label: 'Hue family' },
  { key: 'lightness', label: 'Lightness' },
  { key: 'contrast', label: 'Contrast' },
]

function lightness(hex: string): number {
  return toOklch(hex)?.l ?? 0
}

export function sortColours(colours: Colour[], key: SortKey): Colour[] {
  const arr = [...colours]
  switch (key) {
    case 'name':
      return arr.sort((a, b) => a.name.localeCompare(b.name))
    case 'recent':
    default:
      return arr.sort((a, b) => b.created_at.localeCompare(a.created_at) || b.id - a.id)
  }
}

export interface ColourGroup {
  title: string
  colours: Colour[]
}

/** Named OKLCH hue family for a colour: the single source of truth shared by the
 *  Colors-page grouping and the card pill.
 *
 *  The bins live in haus-colour-utils. vault carried its own copy with the same
 *  shape and the boundaries of an HSL wheel, which is a different wheel: sRGB red
 *  is OKLCH hue 29, not 0, so every bin sat roughly one family anticlockwise of
 *  where it belonged. 17 of 27 canonical colours came out wrong, red among them.
 *
 *  Returns null only for a hex that will not parse, which cannot reach here from
 *  the library, so an unparseable value falls back to Neutral rather than
 *  throwing in a render. */
export function hueFamily(hex: string): string {
  return hausHueFamily(hex) ?? 'Neutral'
}

/** Quantitative OKLCH lightness bands (L × 100), 10-unit steps, brightest first. */
const LIGHTNESS_BANDS: Array<{ title: string; min: number }> = [
  { title: 'L 90–100', min: 0.9 },
  { title: 'L 80–89', min: 0.8 },
  { title: 'L 70–79', min: 0.7 },
  { title: 'L 60–69', min: 0.6 },
  { title: 'L 50–59', min: 0.5 },
  { title: 'L 40–49', min: 0.4 },
  { title: 'L 30–39', min: 0.3 },
  { title: 'L 20–29', min: 0.2 },
  { title: 'L 10–19', min: 0.1 },
  { title: 'L 0–9', min: 0 },
]

function lightnessBand(hex: string): string {
  const l = lightness(hex)
  return (LIGHTNESS_BANDS.find(b => l >= b.min) ?? LIGHTNESS_BANDS[LIGHTNESS_BANDS.length - 1]).title
}

/** Bucket colours by a key fn, emitting groups in the given title order and
 *  dropping any that end up empty. */
function bucketBy(colours: Colour[], keyOf: (hex: string) => string, order: string[]): ColourGroup[] {
  const map = new Map<string, Colour[]>()
  for (const c of colours) {
    const k = keyOf(c.hex)
    const arr = map.get(k)
    if (arr) arr.push(c)
    else map.set(k, [c])
  }
  return order.map(title => ({ title, colours: map.get(title) ?? [] })).filter(g => g.colours.length > 0)
}

export function groupColours(colours: Colour[], key: GroupKey): ColourGroup[] {
  switch (key) {
    case 'none':
      return [{ title: '', colours }]
    case 'hue':
      return bucketBy(colours, hueFamily, [...HUE_FAMILIES.map(f => f.name), 'Neutral'])
    case 'lightness':
      return bucketBy(
        colours,
        lightnessBand,
        LIGHTNESS_BANDS.map(b => b.title),
      )
    case 'contrast': {
      const light: Colour[] = []
      const dark: Colour[] = []
      for (const c of colours) (prefersDarkText(c.hex) ? light : dark).push(c)
      return [
        { title: 'Light, good with dark text', colours: light },
        { title: 'Dark, good with light text', colours: dark },
      ].filter(g => g.colours.length > 0)
    }
    default:
      return [{ title: '', colours }]
  }
}
