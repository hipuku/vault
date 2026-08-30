import { describe, it, expect } from 'vitest'
import type { Palette, Swatch } from '@shared/types'
import { buildTokenTree, exportPalette, EXPORT_FORMATS } from '@renderer/lib/paletteExport'

function palette(kind: Palette['kind']): Palette {
  return {
    id: 1,
    name: 'Test',
    kind,
    base_hex: '#aa1155',
    gen_params: '{}',
    favourite: 0,
    created_at: '',
    updated_at: '',
  }
}

function swatch(p: Partial<Swatch>): Swatch {
  return {
    id: 1,
    palette_id: 1,
    hex: '#000000',
    label: '',
    group_key: '',
    colour_id: null,
    sort_order: 0,
    locked: 0,
    created_at: '',
    ...p,
  }
}

describe('buildTokenTree: tonal', () => {
  it('groups by ramp key and keys by stop label', () => {
    const tree = buildTokenTree(
      palette('tonal'),
      [
        swatch({ group_key: 'primary', label: '500', hex: '#aa1155' }),
        swatch({ group_key: 'primary', label: '700', hex: '#880044' }),
        swatch({ group_key: 'neutral', label: '500', hex: '#777777' }),
      ],
      {},
    )
    expect(tree).toEqual({
      primary: { '500': '#aa1155', '700': '#880044' },
      neutral: { '500': '#777777' },
    })
  })

  it('falls back to "ramp"/"0" for empty group/label', () => {
    const tree = buildTokenTree(palette('tonal'), [swatch({ group_key: '', label: '', hex: '#123456' })], {})
    expect(tree).toEqual({ ramp: { '0': '#123456' } })
  })
})

describe('buildTokenTree: expressive', () => {
  it('maps group keys through the supplied names and defaults blank labels', () => {
    const tree = buildTokenTree(
      palette('expressive'),
      [
        swatch({ group_key: 'g1', label: '', hex: '#aa1155' }),
        swatch({ group_key: 'g1', label: 'dark', hex: '#660033' }),
      ],
      { g1: 'Brand' },
    )
    expect(tree).toEqual({ brand: { default: '#aa1155', dark: '#660033' } })
  })

  it('falls back to "hue" when a group has no name', () => {
    const tree = buildTokenTree(
      palette('expressive'),
      [swatch({ group_key: 'gX', label: 'light', hex: '#ffeeff' })],
      {},
    )
    expect(tree).toEqual({ hue: { light: '#ffeeff' } })
  })
})

describe('exportPalette', () => {
  const p = palette('tonal')
  const swatches = [
    swatch({ group_key: 'primary', label: '500', hex: '#aa1155' }),
    swatch({ group_key: 'primary', label: '700', hex: '#880044' }),
  ]

  it('offers the four documented formats', () => {
    expect(EXPORT_FORMATS.map(f => f.id)).toEqual(['css', 'scss', 'tokens', 'tailwind'])
  })

  it('emits CSS custom properties under :root', () => {
    const css = exportPalette('css', p, swatches, {})
    expect(css.startsWith(':root {')).toBe(true)
    expect(css).toContain('--primary-500: #aa1155;')
    expect(css).toContain('--primary-700: #880044;')
  })

  it('emits SCSS variables', () => {
    const scss = exportPalette('scss', p, swatches, {})
    expect(scss).toContain('$primary-500: #aa1155;')
    expect(scss).not.toContain(':root')
  })

  it('emits nested W3C colour tokens', () => {
    const json = JSON.parse(exportPalette('tokens', p, swatches, {}))
    expect(json.primary['500']).toEqual({ $type: 'color', $value: '#aa1155' })
  })

  it('emits a Tailwind colors config containing the token tree', () => {
    const tw = exportPalette('tailwind', p, swatches, {})
    expect(tw).toContain('colors:')
    expect(tw).toContain('"500": "#aa1155"')
  })
})
