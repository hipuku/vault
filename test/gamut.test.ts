import { describe, it, expect } from 'vitest'
import chroma from 'chroma-js'
import { lchToGamutHex } from '@shared/lib/gamut'

const HEX = /^#[0-9a-f]{6}$/

describe('lchToGamutHex', () => {
  it('returns a valid sRGB hex', () => {
    expect(lchToGamutHex(50, 40, 20)).toMatch(HEX)
  })

  it('leaves an already in-gamut colour essentially unchanged', () => {
    const inGamut = chroma.lch(50, 20, 20)
    const out = lchToGamutHex(50, 20, 20)
    expect(chroma.deltaE(out, inGamut.hex())).toBeLessThan(1)
  })

  it('clamps an out-of-gamut chroma down into sRGB by preserving L and H', () => {
    // Absurdly high chroma forces a reduction.
    const out = lchToGamutHex(50, 200, 30)
    expect(out).toMatch(HEX)
    const [L, , H] = chroma(out).lch()
    expect(L).toBeCloseTo(50, 0)
    expect(H).toBeCloseTo(30, -1)
  })

  it('handles NaN hue (achromatic) gracefully', () => {
    expect(lchToGamutHex(50, 0, NaN)).toMatch(HEX)
  })
})
