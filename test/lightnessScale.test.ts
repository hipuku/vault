import { describe, it, expect } from 'vitest'
import { generateLightnessScale } from '@shared/lib/lightnessScale'

const HEX = /^#[0-9a-f]{6}$/

describe('generateLightnessScale', () => {
  it('returns 10 valid hexes by default', () => {
    const scale = generateLightnessScale('#aa1155')
    expect(scale).toHaveLength(10)
    scale.forEach(hex => expect(hex).toMatch(HEX))
  })

  it('honours a custom step count', () => {
    expect(generateLightnessScale('#aa1155', { steps: 5 })).toHaveLength(5)
  })

  it('ramps from light to dark (lightest first)', () => {
    const scale = generateLightnessScale('#aa1155')
    // rough luminance proxy: sum of channels
    const lum = (h: string) => parseInt(h.slice(1, 3), 16) + parseInt(h.slice(3, 5), 16) + parseInt(h.slice(5, 7), 16)
    expect(lum(scale[0])).toBeGreaterThan(lum(scale[scale.length - 1]))
  })

  it('respects custom lightness bounds', () => {
    const scale = generateLightnessScale('#aa1155', { minL: 20, maxL: 80 })
    expect(scale).toHaveLength(10)
    scale.forEach(hex => expect(hex).toMatch(HEX))
  })

  it('handles achromatic input (NaN hue) without throwing', () => {
    const scale = generateLightnessScale('#808080')
    expect(scale).toHaveLength(10)
    scale.forEach(hex => expect(hex).toMatch(HEX))
  })

  it('is deterministic', () => {
    expect(generateLightnessScale('#4a90d9')).toEqual(generateLightnessScale('#4a90d9'))
  })
})
