// Per-property unit conversion for the type-scale table + export.
// Sizes are stored in px, line-heights as unitless multipliers, tracking in em.

export type SizeUnit = 'px' | 'rem' | 'pt'
export type LineHeightUnit = 'unitless' | 'px' | '%'
export type TrackingUnit = 'em' | 'px' | '%'
export type WeightDisplay = 'number' | 'name'

export interface TypeUnits {
  size: SizeUnit
  weight: WeightDisplay
  lineHeight: LineHeightUnit
  tracking: TrackingUnit
}

/** Canonical forms — the defaults the table opens on. */
export const DEFAULT_UNITS: TypeUnits = {
  size: 'px',
  weight: 'number',
  lineHeight: 'unitless',
  tracking: 'em',
}

/** Root font size that `rem` is relative to. */
const ROOT_PX = 16

export const WEIGHT_NAMES: Record<number, string> = {
  100: 'Thin', 200: 'ExtraLight', 300: 'Light', 400: 'Regular',
  500: 'Medium', 600: 'SemiBold', 700: 'Bold', 800: 'ExtraBold', 900: 'Black',
}

/** Round to ≤3 decimals and drop trailing zeros. */
function trim(n: number): string {
  return String(Math.round(n * 1000) / 1000)
}

export function formatSize(px: number, unit: SizeUnit): string {
  switch (unit) {
    case 'px':  return `${trim(px)}px`
    case 'rem': return `${trim(px / ROOT_PX)}rem`
    case 'pt':  return `${trim(px * 0.75)}pt`
  }
}

export function formatLineHeight(value: string, sizePx: number, unit: LineHeightUnit): string {
  const mult = parseFloat(value)
  if (Number.isNaN(mult)) return value // e.g. 'normal' — leave as-is
  switch (unit) {
    case 'unitless': return trim(mult)
    case 'px':       return `${trim(mult * sizePx)}px`
    case '%':        return `${trim(mult * 100)}%`
  }
}

export function formatTracking(value: string, sizePx: number, unit: TrackingUnit): string {
  const em = parseFloat(value) || 0 // '-0.02em' → -0.02, '0' → 0
  switch (unit) {
    case 'em': return em === 0 ? '0' : `${trim(em)}em`
    case 'px': return em === 0 ? '0' : `${trim(em * sizePx)}px`
    case '%':  return em === 0 ? '0' : `${trim(em * 100)}%`
  }
}

export function formatWeight(weight: number, display: WeightDisplay): string {
  switch (display) {
    case 'number': return String(weight)
    case 'name':   return WEIGHT_NAMES[weight] ?? String(weight)
  }
}
