import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TypeScaleCreate } from '@renderer/organisms/TypeScaleCreate/TypeScaleCreate'
import { TypeScaleView } from '@renderer/organisms/TypeScaleView/TypeScaleView'
import { SpecimenTable } from '@renderer/organisms/SpecimenTable/SpecimenTable'
import { StepEditControl } from '@renderer/molecules/StepEditControl/StepEditControl'
import { ColorFilters } from '@renderer/organisms/ColorFilters/ColorFilters'
import { DEFAULT_UNITS } from '@renderer/lib/typeUnits'
import type { Font, TypeScale, TypeScaleStep } from '@shared/types'

beforeEach(() => {
  ;(window as unknown as { api: unknown }).api = {
    tag: {
      list: vi.fn().mockResolvedValue([]),
      listAssetIds: vi.fn().mockResolvedValue([]),
      listForAsset: vi.fn().mockResolvedValue([]),
      create: vi.fn(),
      assign: vi.fn(),
    },
  }
})

const steps: TypeScaleStep[] = [
  { id: 1, type_scale_id: 1, step_name: 'Display', size: 40, weight: 700, line_height: '1.1', letter_spacing: '0', sort_order: 0 },
  { id: 2, type_scale_id: 1, step_name: 'Body', size: 16, weight: 400, line_height: '1.5', letter_spacing: '0', sort_order: 1 },
]

/**
 * TypeScaleCreate's base size field had no name at all, and its ratio presets
 * showed the chosen one by colour alone, with a star a screen reader read as
 * "black star". The presets are toggles in a named group and the star says
 * "recommended".
 */
describe('TypeScaleCreate', () => {
  const renderIt = () =>
    render(
      <main>
        <TypeScaleCreate fonts={[] as Font[]} onCancel={vi.fn()} onCreate={vi.fn()} />
      </main>,
    )

  it('names the base size, and marks the chosen ratio', async () => {
    const user = userEvent.setup()
    renderIt()
    expect(screen.getByRole('spinbutton', { name: 'Base size' })).toBeInTheDocument()
    const group = screen.getByRole('group', { name: 'Ratio' })
    const presets = group.querySelectorAll('button')
    const pressed = [...presets].filter(b => b.getAttribute('aria-pressed') === 'true')
    expect(pressed).toHaveLength(1)
    await user.click(presets[0])
    expect(presets[0]).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getAllByText(', recommended').length).toBeGreaterThan(0)
  })

  it('has no axe violations', async () => {
    renderIt()
    await waitFor(() => expect(window.api.tag.list).toHaveBeenCalled())
    expect((await axe(document.body)).violations).toEqual([])
  })
})

/**
 * The specimen table's headers sit above the rows, so a screen reader heard each
 * row's metrics as four bare values. Each value now carries its header.
 */
describe('SpecimenTable', () => {
  it('reads each metric with its header', () => {
    render(
      <SpecimenTable steps={steps} headingStack="serif" bodyStack="sans-serif" previewText="" units={DEFAULT_UNITS} />,
    )
    // The first "Size" is the visible column header; the rest are each row's hidden one.
    const hidden = screen.getAllByText(/^Size\s*$/).slice(1)
    expect(hidden).toHaveLength(steps.length)
    expect(hidden[0]).toHaveClass('visually-hidden')
    expect(hidden[0].parentElement?.textContent).toMatch(/^Size \d/)
  })
})

/** Every row's edit button was "Edit step"; each is named for its own step. */
describe('StepEditControl', () => {
  it('is named for its step, and its fields are named inputs', async () => {
    const user = userEvent.setup()
    render(<StepEditControl stepName="Body" size={16} weight={400} lineHeight="1.5" letterSpacing="0" onChange={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: 'Edit Body' }))
    expect(screen.getByRole('dialog', { name: 'Edit Body' })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Line height' })).toHaveValue('1.5')
    expect(screen.getByRole('textbox', { name: 'Tracking' })).toHaveValue('0')
  })
})

describe('TypeScaleView', () => {
  it('has no axe violations', async () => {
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
    render(
      <main>
        <TypeScaleView
          scale={scale}
          steps={steps}
          headingStack="serif"
          bodyStack="sans-serif"
          headingFamily="Georgia"
          bodyFamily="Inter"
          onBack={vi.fn()}
          onRename={vi.fn()}
          onDelete={vi.fn()}
        />
      </main>,
    )
    await waitFor(() => expect(window.api.tag.listForAsset).toHaveBeenCalled())
    expect((await axe(document.body)).violations).toEqual([])
  })
})

describe('ColorFilters', () => {
  it('has no axe violations when open', async () => {
    const user = userEvent.setup()
    render(<ColorFilters sortKey="name" onSortChange={vi.fn()} groupKey="none" onGroupChange={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: /Filters/ }))
    expect(screen.getByRole('group', { name: 'Sort' })).toBeInTheDocument()
    expect((await axe(document.body)).violations).toEqual([])
  })
})
