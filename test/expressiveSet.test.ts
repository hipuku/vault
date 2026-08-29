import { describe, it, expect } from 'vitest'
import chroma from 'chroma-js'
import { generateExpressiveSet } from '@shared/lib/expressiveSet'
import type { FillStrategy } from '@shared/types'

const STRATEGIES: FillStrategy[] = ['interpolate', 'harmony', 'cohesive-distinct']
const L = (hex: string): number => chroma(hex).lch()[0]
const seed = (hex: string, colourId: number | null = null): { hex: string; colourId: number | null } =>
  ({ hex, colourId })

/** Group the flat swatch list back into its {light, mid, dark} triples. */
function groups(out: ReturnType<typeof generateExpressiveSet>) {
  const by = new Map<string, typeof out>()
  for (const s of out) by.set(s.group_key, [...(by.get(s.group_key) ?? []), s])
  return [...by.values()]
}

describe('generateExpressiveSet', () => {
  it.each(STRATEGIES)('%s emits three stops per group with contiguous keys', strategy => {
    const out = generateExpressiveSet([seed('#aa1155'), seed('#3366cc')], 4, strategy)
    const g = groups(out)
    expect(g).toHaveLength(4)
    expect(g.every(t => t.length === 3)).toBe(true)
    expect(out.map(s => s.group_key)).toEqual(
      [0, 1, 2, 3].flatMap(i => Array(3).fill(`hue-${i}`)),
    )
    const orders = out.map(s => s.sort_order)
    expect(new Set(orders).size).toBe(orders.length)
  })

  /* The mid stop is the seed verbatim while light/dark were pinned at L 88/28, so a
     seed lighter than 88 produced a "light" swatch darker than the default one:
     #fff2cc gave light 87.9 against mid 95.6. */
  it.each(STRATEGIES)('%s never puts a lighter stop below the mid', strategy => {
    for (const s of ['#fff2cc', '#ffffff', '#aa1155', '#000000', '#808080', '#3366cc']) {
      for (const [light, mid, dark] of groups(generateExpressiveSet([seed(s)], 3, strategy))) {
        expect(L(light.hex)).toBeGreaterThanOrEqual(L(mid.hex) - 0.2)
        expect(L(mid.hex)).toBeGreaterThanOrEqual(L(dark.hex) - 0.2)
      }
    }
  })

  /* Away from the ends of the lightness range the three stops must be visibly apart.
     Only a seed at L 0 or L 100 has no headroom, and those are covered above. */
  it.each(STRATEGIES)('%s keeps the three stops distinct for a normal seed', strategy => {
    for (const s of ['#fff2cc', '#aa1155', '#808080', '#3366cc']) {
      for (const [light, mid, dark] of groups(generateExpressiveSet([seed(s)], 3, strategy))) {
        expect(L(light.hex)).toBeGreaterThan(L(mid.hex))
        expect(L(mid.hex)).toBeGreaterThan(L(dark.hex))
      }
    }
  })

  it.each(STRATEGIES)('%s preserves every seed hex as a mid stop', strategy => {
    const out = generateExpressiveSet([seed('#aa1155', 1), seed('#3366cc', 2)], 5, strategy)
    const mids = out.filter(s => s.label === '')
    expect(mids.map(m => m.hex)).toEqual(expect.arrayContaining(['#aa1155', '#3366cc']))
    expect(out.filter(s => s.colour_id === 1)).toHaveLength(1)
    expect(out.filter(s => s.colour_id === 2)).toHaveLength(1)
  })

  it('never returns fewer groups than seeds, even when targetCount is smaller', () => {
    const out = generateExpressiveSet(
      [seed('#aa1155'), seed('#3366cc'), seed('#22aa66')], 2, 'interpolate',
    )
    expect(groups(out)).toHaveLength(3)
  })

  it.each(STRATEGIES)('%s rejects an empty seed list rather than emitting NaN', strategy => {
    expect(() => generateExpressiveSet([], 4, strategy)).toThrow(/at least one seed/i)
  })

  it.each(STRATEGIES)('%s emits only valid hexes from an achromatic seed', strategy => {
    for (const s of generateExpressiveSet([seed('#808080')], 5, strategy)) {
      expect(s.hex).toMatch(/^#[0-9a-f]{6}$/)
    }
  })

  it.each(STRATEGIES)('%s is deterministic across calls', strategy => {
    const args = [[seed('#aa1155', 3), seed('#3366cc')], 5, strategy] as const
    expect(generateExpressiveSet(...args)).toEqual(generateExpressiveSet(...args))
  })
})
