import { describe, it, expect } from 'vitest'
import {
  isValidHex,
  normaliseHex,
  toRgbString,
  toHslString,
  toCssVar,
  contrast,
  prefersDarkText,
  nearestShadeIndex,
  findSimilar,
  formatDeltaE,
} from '@renderer/lib/colour'

describe('isValidHex', () => {
  it('accepts 3- and 6-digit hex, with or without #', () => {
    expect(isValidHex('#aa1155')).toBe(true)
    expect(isValidHex('aa1155')).toBe(true)
    expect(isValidHex('#abc')).toBe(true)
    expect(isValidHex('  #ABC  ')).toBe(true) // trimmed
  })

  it('rejects malformed input', () => {
    expect(isValidHex('#gg1155')).toBe(false)
    expect(isValidHex('#12345')).toBe(false) // 5 digits
    expect(isValidHex('')).toBe(false)
    expect(isValidHex('rgb(0,0,0)')).toBe(false)
  })
})

describe('normaliseHex', () => {
  it('returns a lowercase 6-digit hex with a leading #', () => {
    expect(normaliseHex('AA1155')).toBe('#aa1155')
    expect(normaliseHex('#AA1155')).toBe('#aa1155')
  })

  it('expands 3-digit shorthand', () => {
    expect(normaliseHex('#abc')).toBe('#aabbcc')
  })

  it('returns null for unparseable input', () => {
    expect(normaliseHex('nope')).toBeNull()
    expect(normaliseHex('#12345')).toBeNull()
  })
})

describe('toRgbString / toHslString', () => {
  it('formats rgb()', () => {
    expect(toRgbString('#ffffff')).toBe('rgb(255, 255, 255)')
    expect(toRgbString('#000000')).toBe('rgb(0, 0, 0)')
    expect(toRgbString('#ff0000')).toBe('rgb(255, 0, 0)')
  })

  it('formats hsl()', () => {
    expect(toHslString('#ff0000')).toBe('hsl(0, 100%, 50%)')
    expect(toHslString('#000000')).toBe('hsl(0, 0%, 0%)')
  })
})

describe('toCssVar', () => {
  it('slugifies the name into a --color- custom property', () => {
    expect(toCssVar('Ocean Blue', '#4a90d9')).toBe('--color-ocean-blue: #4a90d9;')
  })

  it('falls back to "colour" for a name that slugs to empty', () => {
    expect(toCssVar('!!!', '#000000')).toBe('--color-colour: #000000;')
  })
})

describe('contrast', () => {
  it('reports maximum contrast for black on white', () => {
    const r = contrast('#000000', '#ffffff')
    expect(r.ratio).toBeCloseTo(21, 0)
    expect(r.aa).toBe(true)
    expect(r.aaa).toBe(true)
  })

  it('fails AA for a low-contrast pair', () => {
    const r = contrast('#777777', '#888888')
    expect(r.aa).toBe(false)
    expect(r.aaa).toBe(false)
  })

  it('sets the AA/AAA thresholds at 4.5 and 7', () => {
    // grey on white lands between the two thresholds
    const r = contrast('#767676', '#ffffff')
    expect(r.ratio).toBeGreaterThanOrEqual(4.5)
    expect(r.aa).toBe(true)
    expect(r.aaa).toBe(r.ratio >= 7)
  })
})

describe('prefersDarkText', () => {
  it('prefers dark text on light backgrounds', () => {
    expect(prefersDarkText('#ffffff')).toBe(true)
    expect(prefersDarkText('#ffee88')).toBe(true)
  })

  it('prefers light text on dark backgrounds', () => {
    expect(prefersDarkText('#000000')).toBe(false)
    expect(prefersDarkText('#111133')).toBe(false)
  })
})

describe('nearestShadeIndex', () => {
  const ramp = ['#ffffff', '#cccccc', '#888888', '#444444', '#000000']

  it('finds the closest shade by lightness', () => {
    expect(nearestShadeIndex('#fefefe', ramp)).toBe(0)
    expect(nearestShadeIndex('#010101', ramp)).toBe(4)
    expect(nearestShadeIndex('#7f7f7f', ramp)).toBe(2)
  })
})

describe('findSimilar', () => {
  const library = [
    { id: 1, name: 'Ruby', hex: '#aa1155' },
    { id: 2, name: 'Ocean', hex: '#4a90d9' },
  ]

  it('returns null when nothing is within the ΔE threshold', () => {
    expect(findSimilar('#00ff00', library)).toBeNull()
  })

  it('flags a near-identical colour', () => {
    const match = findSimilar('#aa1156', library)
    expect(match?.id).toBe(1)
    expect(match?.deltaE).toBeLessThan(3)
  })

  it('returns the closest match when several are within threshold', () => {
    const lib = [
      { id: 1, name: 'a', hex: '#aa1155' },
      { id: 2, name: 'b', hex: '#aa1157' },
    ]
    const match = findSimilar('#aa1156', lib, 10)
    expect(match?.id).toBe(2) // #aa1157 is closer to #aa1156 than #aa1155
  })

  it('applies the threshold as a strict upper bound', () => {
    const target = '#a81255' // ΔE ~0.43 from Ruby
    const d = findSimilar(target, library, 100)!.deltaE
    expect(findSimilar(target, library, d + 0.01)?.id).toBe(1)
    expect(findSimilar(target, library, d)).toBeNull() // strict `<`, so d itself excludes
  })
})

describe('formatDeltaE', () => {
  it('rounds to one decimal', () => {
    expect(formatDeltaE(2.345)).toBe('2.3')
    expect(formatDeltaE(0)).toBe('0.0')
  })
})
