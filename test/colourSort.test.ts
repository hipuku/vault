import { describe, it, expect } from 'vitest'
import type { Colour } from '@shared/types'
import { sortColours, groupColours, hueFamily } from '@renderer/lib/colourSort'

function colour(p: Partial<Colour>): Colour {
  return {
    id: 1,
    hex: '#000000',
    name: '',
    favourite: 0,
    created_at: '2026-01-01T00:00:00Z',
    ...p,
  } as Colour
}

describe('hueFamily', () => {
  it('classifies saturated colours into named OKLCH families', () => {
    // The bins are placed for the OKLCH wheel, where sRGB red is hue 29 rather
    // than 0. An earlier version of this test asserted #ff0000 was Orange and
    // explained it as OKLCH being counterintuitive. It was the bins that were
    // wrong: they were an HSL wheel's boundaries read as OKLCH ones, which put
    // every family about one bin anticlockwise of where it belonged.
    expect(hueFamily('#ff0000')).toBe('Red') // hue ~29
    expect(hueFamily('#0000ff')).toBe('Blue') // hue ~264
    expect(hueFamily('#00cc00')).toBe('Green') // hue ~142
    expect(hueFamily('#008080')).toBe('Cyan') // hue ~195, CSS teal
    // Tailwind calls #0891b2 cyan-600 and this test used to take that as the
    // answer. At OKLCH hue 222 human naming does not agree: of the 59 colours
    // in haus-colour-names between hue 220 and 225 whose name ends in a family
    // word, 54 are called blue and 5 cyan. A palette's own vocabulary is not
    // evidence about perception.
    expect(hueFamily('#0891b2')).toBe('Blue') // hue ~222
    expect(hueFamily('#e0115f')).toBe('Pink') // hue ~9
  })

  it('calls near-achromatic colours Neutral', () => {
    expect(hueFamily('#808080')).toBe('Neutral')
    expect(hueFamily('#ffffff')).toBe('Neutral')
    expect(hueFamily('#111111')).toBe('Neutral')
  })
})

describe('sortColours', () => {
  it('sorts by name A–Z', () => {
    const out = sortColours(
      [colour({ id: 1, name: 'Zephyr' }), colour({ id: 2, name: 'Amber' }), colour({ id: 3, name: 'Mint' })],
      'name',
    )
    expect(out.map(c => c.name)).toEqual(['Amber', 'Mint', 'Zephyr'])
  })

  it('sorts by recency, breaking ties on id descending', () => {
    const out = sortColours(
      [
        colour({ id: 1, created_at: '2026-01-01T00:00:00Z' }),
        colour({ id: 2, created_at: '2026-03-01T00:00:00Z' }),
        colour({ id: 3, created_at: '2026-03-01T00:00:00Z' }),
      ],
      'recent',
    )
    expect(out.map(c => c.id)).toEqual([3, 2, 1])
  })

  it('does not mutate the input array', () => {
    const input = [colour({ id: 1, name: 'B' }), colour({ id: 2, name: 'A' })]
    const snapshot = input.map(c => c.id)
    sortColours(input, 'name')
    expect(input.map(c => c.id)).toEqual(snapshot)
  })
})

describe('groupColours', () => {
  it('returns a single untitled group when grouping is off', () => {
    const colours = [colour({ id: 1 }), colour({ id: 2 })]
    const groups = groupColours(colours, 'none')
    expect(groups).toHaveLength(1)
    expect(groups[0].title).toBe('')
    expect(groups[0].colours).toHaveLength(2)
  })

  it('drops empty hue buckets and keeps family order', () => {
    const groups = groupColours(
      [
        colour({ id: 1, hex: '#008080' }), // Cyan (OKLCH hue ~195)
        colour({ id: 2, hex: '#ff0000' }), // Red (OKLCH hue ~29)
      ],
      'hue',
    )
    const titles = groups.map(g => g.title)
    expect(titles).toContain('Red')
    expect(titles).toContain('Cyan')
    expect(titles).not.toContain('Green')
    expect(titles.indexOf('Red')).toBeLessThan(titles.indexOf('Cyan'))
  })

  it('splits by contrast into light- and dark-text buckets', () => {
    const groups = groupColours(
      [
        colour({ id: 1, hex: '#ffffff' }), // prefers dark text
        colour({ id: 2, hex: '#000000' }), // prefers light text
      ],
      'contrast',
    )
    const light = groups.find(g => g.title.startsWith('Light'))
    const dark = groups.find(g => g.title.startsWith('Dark'))
    expect(light?.colours.map(c => c.id)).toEqual([1])
    expect(dark?.colours.map(c => c.id)).toEqual([2])
  })
})
