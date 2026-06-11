import { wcagContrast, differenceCiede2000, converter, formatHex, parse } from 'culori'
import { nearestNames } from './colourNames'

const toRgb = converter('rgb')
const toHsl = converter('hsl')
const deltaE = differenceCiede2000()

export const WHITE = '#ffffff'
export const BLACK = '#000000'

// ── Validation / normalisation ────────────────────────────────────────────────

const HEX_RE = /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/

export function isValidHex(input: string): boolean {
  return HEX_RE.test(input.trim())
}

/** Returns a normalised 6-digit lowercase hex (`#rrggbb`), or null if unparseable. */
export function normaliseHex(input: string): string | null {
  const trimmed = input.trim()
  if (!HEX_RE.test(trimmed)) return null
  const withHash = trimmed.startsWith('#') ? trimmed : `#${trimmed}`
  const parsed = parse(withHash)
  return parsed ? formatHex(parsed) : null
}

// ── Format conversions ────────────────────────────────────────────────────────

export function toRgbString(hex: string): string {
  const c = toRgb(hex)
  if (!c) return hex
  const r = Math.round(c.r * 255)
  const g = Math.round(c.g * 255)
  const b = Math.round(c.b * 255)
  return `rgb(${r}, ${g}, ${b})`
}

export function toHslString(hex: string): string {
  const c = toHsl(hex)
  if (!c) return hex
  const h = Math.round(c.h ?? 0)
  const s = Math.round(c.s * 100)
  const l = Math.round(c.l * 100)
  return `hsl(${h}, ${s}%, ${l}%)`
}

/** A CSS custom-property declaration from a name + hex, e.g. `--color-ocean: #4a90d9;`. */
export function toCssVar(name: string, hex: string): string {
  const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'colour'
  return `--color-${slug}: ${hex};`
}

// ── WCAG contrast ─────────────────────────────────────────────────────────────

export interface ContrastResult {
  ratio: number
  /** Passes WCAG AA for normal text (>= 4.5). */
  aa: boolean
  /** Passes WCAG AAA for normal text (>= 7). */
  aaa: boolean
}

export function contrast(hex: string, against: string): ContrastResult {
  const ratio = wcagContrast(hex, against)
  return { ratio, aa: ratio >= 4.5, aaa: ratio >= 7 }
}

/** Whether black text reads better than white on this background. */
export function prefersDarkText(hex: string): boolean {
  return wcagContrast(hex, BLACK) >= wcagContrast(hex, WHITE)
}

// ── Nearest name (meodai dataset, two-pass — see colourNames.ts) ───────────────

export interface NameSuggestion {
  name: string
  hex: string
  deltaE: number
}

export function nearestName(hex: string): NameSuggestion {
  return nearestNames(hex, 1).best
}

// Re-export the richer naming API for callers that want runners + confidence.
export { nearestNames, confidenceLabel, firstUnusedName, warmColourNames } from './colourNames'
export type { NameResult, NameMatch, ConfidenceBands } from './colourNames'

// ── Similar-colour detection (against the existing library) ────────────────────

export interface SimilarMatch {
  id: number
  name: string
  hex: string
  deltaE: number
}

/**
 * Finds the closest existing library colour within `threshold` ΔE2000 of `hex`.
 * Used to warn before adding a near-duplicate. Default threshold 3 (≈ "just
 * noticeable difference" boundary).
 */
export function findSimilar(
  hex: string,
  library: ReadonlyArray<{ id: number; name: string; hex: string }>,
  threshold = 3
): SimilarMatch | null {
  let best: SimilarMatch | null = null
  for (const c of library) {
    const d = deltaE(hex, c.hex)
    if (d < threshold && (best === null || d < best.deltaE)) {
      best = { id: c.id, name: c.name, hex: c.hex, deltaE: d }
    }
  }
  return best
}

/** Round a ΔE for display (one decimal). */
export function formatDeltaE(d: number): string {
  return d.toFixed(1)
}
