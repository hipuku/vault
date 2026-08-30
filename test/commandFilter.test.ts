import { describe, it, expect } from 'vitest'
import { fuzzyScore, filterCommands, type Searchable } from '@renderer/lib/commandFilter'

describe('fuzzyScore', () => {
  it('scores an empty query as neutral (0)', () => {
    expect(fuzzyScore('anything', '')).toBe(0)
  })

  it('returns null when the query is not a subsequence', () => {
    expect(fuzzyScore('Colors', 'xyz')).toBeNull()
    expect(fuzzyScore('Add font', 'zzz')).toBeNull()
  })

  it('matches a subsequence even with gaps', () => {
    expect(fuzzyScore('Type Scales', 'tsc')).not.toBeNull()
  })

  it('is case-insensitive', () => {
    expect(fuzzyScore('Palettes', 'PAL')).toEqual(fuzzyScore('palettes', 'pal'))
  })

  it('rewards a contiguous prefix over a scattered match', () => {
    const contiguous = fuzzyScore('palette', 'pal')!
    const scattered = fuzzyScore('parallel', 'pal')! // p..a..l with gaps
    expect(contiguous).toBeGreaterThan(scattered)
  })

  it('rewards word-boundary matches', () => {
    // Same length, same match positions (0 and 3), so the only difference is that
    // the second char sits after a space (word boundary) in the first string.
    const boundary = fuzzyScore('ab cd', 'ac')!
    const midword = fuzzyScore('abzcd', 'ac')!
    expect(boundary).toBeGreaterThan(midword)
  })

  it('gives shorter targets a small edge for the same match', () => {
    expect(fuzzyScore('col', 'col')!).toBeGreaterThan(fuzzyScore('collection', 'col')!)
  })
})

describe('filterCommands', () => {
  const commands: Searchable[] = [
    { id: 'nav-colours', label: 'Go to Colors', keywords: 'colours' },
    { id: 'nav-fonts', label: 'Go to Fonts' },
    { id: 'nav-palettes', label: 'Go to Palettes' },
    { id: 'nav-type', label: 'Go to Type Scales', keywords: 'typography' },
    { id: 'new-colour', label: 'Add colour', keywords: 'new hex' },
    { id: 'new-font', label: 'Add font', keywords: 'new typeface' },
  ]

  it('returns everything, unchanged, for an empty query', () => {
    expect(filterCommands(commands, '')).toEqual(commands)
    expect(filterCommands(commands, '   ')).toEqual(commands)
  })

  it('drops non-matching commands', () => {
    const out = filterCommands(commands, 'zzz')
    expect(out).toHaveLength(0)
  })

  it('finds a command by its label subsequence', () => {
    const out = filterCommands(commands, 'palettes')
    expect(out[0].id).toBe('nav-palettes')
  })

  it('matches via keywords when the label does not contain the query', () => {
    // "typography" is only in keywords, not the label
    const out = filterCommands(commands, 'typography')
    expect(out.map(c => c.id)).toContain('nav-type')
  })

  it('ranks a tighter match first', () => {
    const out = filterCommands(commands, 'add font')
    expect(out[0].id).toBe('new-font')
  })

  it('keeps input order for equally-scored ties', () => {
    // Identical length + match structure → identical score → stable input order.
    const tied: Searchable[] = [
      { id: 'first', label: 'Foo bar' },
      { id: 'second', label: 'Foo baz' },
    ]
    const out = filterCommands(tied, 'foo ba')
    expect(out.map(c => c.id)).toEqual(['first', 'second'])
  })
})
