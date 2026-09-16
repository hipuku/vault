import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { ColorCard } from '@renderer/organisms/ColorCard/ColorCard'
import { FontCard } from '@renderer/organisms/FontCard/FontCard'
import { PaletteCard } from '@renderer/organisms/PaletteCard/PaletteCard'
import { TypeScaleCard } from '@renderer/organisms/TypeScaleCard/TypeScaleCard'
import type { Colour, Font, Palette, Swatch, TypeScale, TypeScaleStep } from '@shared/types'

/**
 * The four library cards share one shell. Each is a single button, named for
 * what it opens, and everything inside it (the preview, the pen, the chip) is
 * content of that one control rather than a second thing to tab to.
 */
const colour: Colour = { id: 1, name: 'Raspberry', hex: '#8B1E3F', favourite: 1, created_at: '' }
const font: Font = {
  id: 1,
  family: 'Inter',
  category: 'sans-serif',
  source: 'google',
  source_url: '',
  weights: '["400","700"]',
  favourite: 0,
  created_at: '',
}
const palette: Palette = {
  id: 1,
  name: 'Ocean tonal',
  kind: 'tonal',
  base_hex: '#1E5B8B',
  gen_params: '{}',
  favourite: 0,
  created_at: '',
  updated_at: '',
}
const swatches: Swatch[] = ['#DCE8F2', '#1E5B8B', '#0B2236'].map((hex, i) => ({
  id: i + 1,
  palette_id: 1,
  hex,
  label: String(i),
  group_key: 'blue',
  colour_id: null,
  sort_order: i,
  locked: 0,
  created_at: '',
}))
const scale: TypeScale = {
  id: 1,
  name: 'Product',
  heading_font_id: null,
  body_font_id: null,
  base_size: 16,
  ratio: '1.25',
  favourite: 0,
  created_at: '',
  updated_at: '',
}
const steps: TypeScaleStep[] = [
  {
    id: 1,
    type_scale_id: 1,
    step_name: 'Display',
    size: 40,
    weight: 700,
    line_height: '1.1',
    letter_spacing: '0',
    sort_order: 0,
  },
  {
    id: 2,
    type_scale_id: 1,
    step_name: 'Body',
    size: 16,
    weight: 400,
    line_height: '1.5',
    letter_spacing: '0',
    sort_order: 1,
  },
]

const cases: Array<[string, () => React.ReactElement, string]> = [
  ['ColorCard', () => <ColorCard colour={colour} onOpen={vi.fn()} />, 'Open Raspberry'],
  ['FontCard', () => <FontCard font={font} previewText="" previewSize={24} onOpen={vi.fn()} />, 'Open Inter'],
  ['PaletteCard', () => <PaletteCard palette={palette} swatches={swatches} onOpen={vi.fn()} />, 'Open Ocean tonal'],
  [
    'TypeScaleCard',
    () => <TypeScaleCard scale={scale} steps={steps} headingStack="serif" bodyStack="sans-serif" onOpen={vi.fn()} />,
    'Open Product',
  ],
]

const descriptions: Record<string, string> = {
  // The colour is a favourite, so it says so first.
  ColorCard: 'Favourite, Pink, #8B1E3F',
  FontCard: 'Sans Serif, 2 weights',
  PaletteCard: 'Tonal, 1 ramp',
  TypeScaleCard: 'Major Third, 16px',
}

describe.each(cases)('%s', (_name, element, accessibleName) => {
  it('is one button, named for what it opens', () => {
    render(element())
    expect(screen.getAllByRole('button')).toHaveLength(1)
    expect(screen.getByRole('button', { name: accessibleName })).toBeTruthy()
  })

  it('describes itself with its meta row, since the label replaces its contents', () => {
    render(element())
    const button = screen.getByRole('button', { name: accessibleName })
    expect(button).toHaveAccessibleDescription(descriptions[_name])
  })

  it('opens on click', async () => {
    const tree = element()
    const onOpen = tree.props.onOpen as ReturnType<typeof vi.fn>
    render(tree)
    await userEvent.click(screen.getByRole('button', { name: accessibleName }))
    expect(onOpen).toHaveBeenCalledOnce()
  })

  it('has no axe violations', async () => {
    const { container } = render(element())
    expect((await axe(container)).violations).toEqual([])
  })
})
