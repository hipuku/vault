import React from 'react'
import { render, screen } from '@testing-library/react'
import { axe } from 'vitest-axe'
import { describe, expect, it } from 'vitest'
import { Input } from '@renderer/atoms/Input/Input'
import { Chip } from '@renderer/atoms/Chip/Chip'

describe('Input · unit', () => {
  it('keeps the field named, and has the unit describe it', () => {
    render(<Input aria-label="Base size" unit="px" type="number" value={16} onChange={() => {}} />)
    const field = screen.getByRole('spinbutton', { name: 'Base size' })
    expect(field).toHaveAccessibleDescription('px')
  })

  it('keeps a description the caller passed, alongside the unit', () => {
    render(
      <>
        <span id="hint">Between 10 and 24</span>
        <Input aria-label="Base size" aria-describedby="hint" unit="px" defaultValue="16" />
      </>,
    )
    expect(screen.getByRole('textbox', { name: 'Base size' })).toHaveAccessibleDescription('Between 10 and 24 px')
  })

  it('renders a bare input when there is no unit', () => {
    const { container } = render(<Input aria-label="Name" />)
    expect(container.firstElementChild?.tagName).toBe('INPUT')
  })

  it('has no axe violations', async () => {
    const { container } = render(<Input aria-label="Size" mono unit="px" defaultValue="16" />)
    expect((await axe(container)).violations).toEqual([])
  })
})

describe('Chip · dot', () => {
  it('draws the dot as decoration, so the label is the whole name', () => {
    const { container } = render(<Chip dot="#7653ab" label="Brand" />)
    const dot = container.querySelector('[aria-hidden]') as HTMLElement
    expect(dot).toHaveStyle({ background: '#7653ab' })
    expect(container.textContent).toBe('Brand')
  })
})
