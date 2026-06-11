import { converter } from 'culori'
import type { Colour } from '@shared/types'
import { prefersDarkText } from './colour'

const toOklch = converter('oklch')

export type SortKey = 'recent' | 'name' | 'hue' | 'lightness'
export type GroupKey = 'none' | 'tone'

export const SORT_OPTIONS: Array<{ key: SortKey; label: string }> = [
  { key: 'recent', label: 'Recently added' },
  { key: 'name', label: 'Name (A–Z)' },
  { key: 'hue', label: 'Hue' },
  { key: 'lightness', label: 'Lightness' },
]

export const GROUP_OPTIONS: Array<{ key: GroupKey; label: string }> = [
  { key: 'none', label: 'No grouping' },
  { key: 'tone', label: 'By tone' },
]

function lightness(hex: string): number {
  return toOklch(hex)?.l ?? 0
}
function hue(hex: string): number {
  return toOklch(hex)?.h ?? 0
}

export function sortColours(colours: Colour[], key: SortKey): Colour[] {
  const arr = [...colours]
  switch (key) {
    case 'name':      return arr.sort((a, b) => a.name.localeCompare(b.name))
    case 'hue':       return arr.sort((a, b) => hue(a.hex) - hue(b.hex))
    case 'lightness': return arr.sort((a, b) => lightness(b.hex) - lightness(a.hex))
    case 'recent':
    default:          return arr.sort((a, b) => b.created_at.localeCompare(a.created_at) || b.id - a.id)
  }
}

export interface ColourGroup {
  title: string
  colours: Colour[]
}

/** Split into tone groups: light colours (dark text reads better) vs dark. */
export function groupColours(colours: Colour[], key: GroupKey): ColourGroup[] {
  if (key === 'none') return [{ title: '', colours }]

  const light: Colour[] = []
  const dark: Colour[] = []
  for (const c of colours) (prefersDarkText(c.hex) ? light : dark).push(c)

  return [
    { title: 'Light — good with dark text', colours: light },
    { title: 'Dark — good with light text', colours: dark },
  ].filter(g => g.colours.length > 0)
}
