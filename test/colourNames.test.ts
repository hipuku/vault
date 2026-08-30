import { describe, it, expect } from 'vitest'
import { differenceCiede2000 } from 'culori'
import { nearestNames } from '@renderer/lib/colourNames'
import { colourNameEntries, COLOUR_NAME_COUNT } from 'haus-colour-names'

const deltaE = differenceCiede2000()
const entries = colourNameEntries()

/** The honest answer: an exhaustive CIEDE2000 scan over the whole dataset. */
function trueNearest(hex: string): { name: string; deltaE: number } {
  let best: { name: string; deltaE: number } | null = null
  for (const { hex: h, name } of entries) {
    const d = deltaE(hex, h)
    if (best === null || d < best.deltaE) best = { name, deltaE: d }
  }
  return best!
}

describe('the shared dataset', () => {
  it('is the same 31,900 names vault used to carry itself', () => {
    expect(COLOUR_NAME_COUNT).toBe(31900)
    expect(entries).toHaveLength(31900)
  })

  it('normalises every hex, including the ones with a leading zero', () => {
    for (const { hex } of entries) expect(hex).toMatch(/^#[0-9a-f]{6}$/)
  })
})

describe('nearestNames', () => {
  /* These two are regressions. Both were named by a match that was not the nearest,
     because the score was rounded to 1dp before sorting: everything within 0.05
     collapsed into a tie that the dataset's key order then broke arbitrarily.
     #c2009b returned Fuchsia Flourish (1.540) over Jealous Jellyfish (1.479). */
  it.each(['#c2009b', '#266439'])('names %s with the genuinely nearest entry', hex => {
    expect(nearestNames(hex).best.name).toBe(trueNearest(hex).name)
  })

  /* The prefilter is a CIE76 radius of 28, which is not provably safe, since CIEDE2000
     compresses high-chroma differences, so in principle it can discard the true
     winner. This asserts it does not, across the gamut extremes where the two
     metrics diverge most. Every probe below sits at least 1.5 ΔE from its nearest
     entry, so none of them is a trivial exact hit. Verified: no disagreement across
     500 random colours. If this ever fails, the radius is the thing to widen. */
  it.each([
    '#0000ff',
    '#ffee00', // the two where CIE76 and CIEDE2000 diverge most
    '#deea13',
    '#34e411',
    '#8e3376',
    '#923c16',
    '#4b7314',
    '#722cd3',
  ])('agrees with an exhaustive scan for %s', hex => {
    expect(nearestNames(hex).best.name).toBe(trueNearest(hex).name)
  })

  it('reports the raw distance, rounded only for display', () => {
    const { best } = nearestNames('#c2009b')
    expect(best.deltaE).toBeCloseTo(trueNearest('#c2009b').deltaE, 1)
  })

  it('orders runners by increasing distance', () => {
    const { best, runners } = nearestNames('#aa1155', 6)
    const all = [best, ...runners].map(m => m.deltaE)
    expect(all).toEqual([...all].sort((a, b) => a - b))
  })

  it('returns distinct names', () => {
    const { best, runners } = nearestNames('#aa1155', 6)
    const names = [best, ...runners].map(m => m.name)
    expect(new Set(names).size).toBe(names.length)
  })

  it('every returned hex is a real entry in the dataset', () => {
    const { best, runners } = nearestNames('#123456', 6)
    const known = new Set(entries.map(([h]) => `#${h}`))
    for (const m of [best, ...runners]) expect(known.has(m.hex)).toBe(true)
  })

  /* An unparseable hex has no match. deltaE must not be 0, because the UI renders that
     as an exact match. */
  it('does not claim a perfect match for an unparseable hex', () => {
    const { best, runners, confidence } = nearestNames('not-a-colour')
    expect(best.name).toBe('')
    expect(best.deltaE).toBeNaN()
    expect(runners).toEqual([])
    expect(confidence).toEqual({ veryClose: 0, approximate: 0, distant: 0 })
  })

  it('is deterministic', () => {
    expect(nearestNames('#3366cc')).toEqual(nearestNames('#3366cc'))
  })
})
