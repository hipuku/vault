import { describe, it, expect } from 'vitest'
import chroma from 'chroma-js'
import { generateTonalSystem, TONAL_STOP_LABELS } from '@shared/lib/tonalSystem'
import type { RampName } from '@shared/types'

const ALL: RampName[] = ['primary', 'neutral', 'success', 'warning', 'error']
const lch = (hex: string): number[] => chroma(hex).lch()

describe('generateTonalSystem', () => {
  it('emits ten stops per ramp, in the ramp order asked for', () => {
    const out = generateTonalSystem('#aa1155', ['primary', 'error'])
    expect(out).toHaveLength(20)
    expect(out.slice(0, 10).map(s => s.group_key)).toEqual(Array(10).fill('primary'))
    expect(out.slice(10).map(s => s.label)).toEqual(TONAL_STOP_LABELS)
  })

  it('gives every swatch a unique, increasing sort_order', () => {
    const orders = generateTonalSystem('#aa1155', ALL).map(s => s.sort_order)
    expect(new Set(orders).size).toBe(orders.length)
    expect(orders).toEqual([...orders].sort((a, b) => a - b))
  })

  /* Each ramp runs light to dark. Before the gamut fix this held in the middle but
     not at the ends: a saturated seed's light stops were clipped, and #0000ff came
     back a uniform ~5 L* short of what was asked for. */
  it.each(ALL)('%s runs strictly light to dark', ramp => {
    const ls = generateTonalSystem('#0000ff', [ramp]).map(s => lch(s.hex)[0])
    for (let i = 1; i < ls.length; i++) expect(ls[i]).toBeLessThan(ls[i - 1])
  })

  it.each(['#0000ff', '#00ff00', '#aa1155', '#fff8e7'])(
    'holds the requested lightness for %s rather than clipping to it',
    seed => {
      const got = generateTonalSystem(seed, ['primary']).map(s => lch(s.hex)[0])
      const want = Array.from({ length: 10 }, (_, i) => 97 - (i / 9) * (97 - 8))
      got.forEach((L, i) => expect(Math.abs(L - want[i])).toBeLessThan(1))
    },
  )

  /* The semantic ramps are defined by their hue. Routing through lchToGamutHex keeps
     it; chroma.lch's RGB clamp did not.

     Only stops with real chroma are measured. A ramp's outermost stops are nearly
     white or nearly black, and there hue is atan2 over two values near zero, so 8-bit
     quantisation alone swings it: the lightest error stop sits at C 1.8 and reads 10°
     off a hue nobody can see in it. Above C 10 the whole set holds within 2.5°. */
  const PERCEPTIBLE_CHROMA = 10

  it.each([
    ['success', 145],
    ['warning', 75],
    ['error', 30],
  ] as const)('keeps %s on hue %i wherever the hue is visible', (ramp, hue) => {
    let checked = 0
    for (const seed of ['#fff8e7', '#aa1155', '#123456', '#00ff00']) {
      for (const s of generateTonalSystem(seed, [ramp])) {
        const [, C, H] = lch(s.hex)
        if (isNaN(H) || C < PERCEPTIBLE_CHROMA) continue
        checked++
        expect(Math.abs(H - hue)).toBeLessThan(3)
      }
    }
    expect(checked).toBeGreaterThan(10) // so the filter above cannot make this vacuous
  })

  it('anchors the seed colour to exactly one stop, in the primary ramp', () => {
    const out = generateTonalSystem('#aa1155', ALL, 42)
    const anchored = out.filter(s => s.colour_id === 42)
    expect(anchored).toHaveLength(1)
    expect(anchored[0].group_key).toBe('primary')
  })

  it('anchors nothing when no seed colour id is given', () => {
    expect(generateTonalSystem('#aa1155', ALL).every(s => s.colour_id === null)).toBe(true)
  })

  it('produces valid hexes for an achromatic seed', () => {
    for (const s of generateTonalSystem('#808080', ALL)) {
      expect(s.hex).toMatch(/^#[0-9a-f]{6}$/)
    }
  })

  /* Load-bearing: PaletteCreate previews with this function and the main process
     re-runs it from the same seed before writing, so a drift between two calls would
     save a palette that does not match the one the user approved. */
  it('is deterministic across calls', () => {
    expect(generateTonalSystem('#aa1155', ALL, 7)).toEqual(generateTonalSystem('#aa1155', ALL, 7))
  })
})
