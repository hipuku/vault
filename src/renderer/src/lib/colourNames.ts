import { converter, differenceCiede2000 } from 'culori'
import namesRaw from './colornames.json'

// Ported from hexicon: name any hex against the meodai dataset (31,900 names)
// with a two-pass match — a fast CIE76 coarse scan narrows the field, then
// CIEDE2000 re-scores the candidates for an accurate ranking + confidence.

const toLab = converter('lab')
const deltaE = differenceCiede2000()

export interface NameMatch {
  name: string
  hex: string
  deltaE: number
}

export interface ConfidenceBands {
  veryClose: number // ΔE < 3 — "same name" zone
  approximate: number // ΔE 3–10
  distant: number // ΔE ≥ 10 (within scan radius)
}

export interface NameResult {
  best: NameMatch
  runners: NameMatch[] // next distinct names
  confidence: ConfidenceBands
}

interface Entry {
  hex: string
  name: string
  L: number
  a: number
  b: number
}

let _entries: Entry[] | null = null

function getEntries(): Entry[] {
  if (_entries) return _entries
  const out: Entry[] = []
  for (const [hexRaw, name] of Object.entries(namesRaw)) {
    const h = hexRaw.length === 6 ? hexRaw : hexRaw.padStart(6, '0')
    const lab = toLab(`#${h}`)
    if (!lab) continue
    out.push({ hex: `#${h.toLowerCase()}`, name, L: lab.l, a: lab.a, b: lab.b })
  }
  _entries = out
  return out
}

/** Warm the lookup table (lazy Lab precompute) ahead of first query. */
export function warmColourNames(): void {
  getEntries()
}

const CIE76_RADIUS = 28

export function nearestNames(hex: string, count = 6): NameResult {
  // deltaE NaN, not 0: an unparseable hex has no match, and 0 would render as an exact one.
  const empty: NameResult = {
    best: { name: '', hex, deltaE: NaN },
    runners: [],
    confidence: { veryClose: 0, approximate: 0, distant: 0 },
  }
  const lab = toLab(hex)
  if (!lab) return empty

  const list = getEntries()
  const candidates: Entry[] = []
  for (const e of list) {
    const d = Math.sqrt((lab.l - e.L) ** 2 + (lab.a - e.a) ** 2 + (lab.b - e.b) ** 2)
    if (d < CIE76_RADIUS) candidates.push(e)
  }
  const pool = candidates.length ? candidates : list

  // Sort on the raw distance, round only for display. Rounding first collapsed every
  // candidate within 0.05 into a tie, which the dataset's key order then broke
  // arbitrarily — roughly one colour in fourteen was named by a match that was not
  // the nearest one.
  const scored = pool
    .map(e => ({ name: e.name, hex: e.hex, deltaE: deltaE(hex, e.hex) }))
    .sort((a, b) => a.deltaE - b.deltaE)
    .map(m => ({ ...m, deltaE: Math.round(m.deltaE * 10) / 10 }))

  if (scored.length === 0) return empty

  const confidence: ConfidenceBands = {
    veryClose: scored.filter(m => m.deltaE < 3).length,
    approximate: scored.filter(m => m.deltaE >= 3 && m.deltaE < 10).length,
    distant: scored.filter(m => m.deltaE >= 10).length,
  }

  // De-duplicate by name so the runner list shows distinct alternatives.
  const seen = new Set<string>()
  const distinct: NameMatch[] = []
  for (const m of scored) {
    const key = m.name.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    distinct.push(m)
    if (distinct.length >= count) break
  }

  return { best: distinct[0], runners: distinct.slice(1), confidence }
}

/** Plain-English read of how contested a colour's naming is. */
export function confidenceLabel(c: ConfidenceBands): string {
  if (c.veryClose <= 2) return 'Unambiguous'
  if (c.veryClose <= 8) return 'Contested name'
  return 'Disputed boundary'
}

/** First name (best, then runners) not already taken by an existing library colour. */
export function firstUnusedName(result: NameResult, taken: ReadonlySet<string>): NameMatch | null {
  const all = [result.best, ...result.runners]
  return all.find(m => m.name && !taken.has(m.name.toLowerCase())) ?? null
}
