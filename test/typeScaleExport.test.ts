import { describe, it, expect } from 'vitest'
import { exportTypeScale, TYPE_EXPORT_FORMATS } from '@renderer/lib/typeScaleExport'
import { DEFAULT_UNITS } from '@renderer/lib/typeUnits'

const steps = [
  { step_name: 'Display', size: 48, weight: 700, line_height: '1.1', letter_spacing: '-0.02em' },
  { step_name: 'Body', size: 16, weight: 400, line_height: '1.6', letter_spacing: '0' },
]

describe('exportTypeScale', () => {
  it('offers the four documented formats', () => {
    expect(TYPE_EXPORT_FORMATS.map(f => f.id)).toEqual(['css', 'scss', 'tokens', 'tailwind'])
  })

  it('returns an empty string for an unknown format', () => {
    expect(exportTypeScale('xml', steps, DEFAULT_UNITS)).toBe('')
  })

  it('slugifies step names into custom-property keys', () => {
    const css = exportTypeScale('css', steps, DEFAULT_UNITS)
    expect(css).toContain('--type-display-size: 48px;')
    expect(css).toContain('--type-body-size: 16px;')
  })

  it('emits size/weight/leading/tracking for each step under :root', () => {
    const css = exportTypeScale('css', steps, DEFAULT_UNITS)
    expect(css.startsWith(':root {')).toBe(true)
    expect(css).toContain('--type-display-weight: 700;')
    expect(css).toContain('--type-display-leading: 1.1;')
    expect(css).toContain('--type-display-tracking: -0.02em;')
  })

  it('respects the selected units', () => {
    const css = exportTypeScale('css', steps, { ...DEFAULT_UNITS, size: 'rem' })
    expect(css).toContain('--type-display-size: 3rem;')
    expect(css).toContain('--type-body-size: 1rem;')
  })

  it('emits SCSS variables', () => {
    const scss = exportTypeScale('scss', steps, DEFAULT_UNITS)
    expect(scss).toContain('$type-display-size: 48px;')
    expect(scss).not.toContain(':root')
  })

  it('emits valid W3C design tokens JSON', () => {
    const json = JSON.parse(exportTypeScale('tokens', steps, DEFAULT_UNITS))
    expect(json.display.$type).toBe('typography')
    expect(json.display.$value).toEqual({
      fontSize: '48px',
      fontWeight: 700,
      lineHeight: '1.1',
      letterSpacing: '-0.02em',
    })
  })

  it('emits a Tailwind fontSize config', () => {
    const tw = exportTypeScale('tailwind', steps, DEFAULT_UNITS)
    expect(tw).toContain('fontSize: {')
    expect(tw).toContain("'display': ['48px', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '700' }],")
  })
})
