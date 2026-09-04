import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'
import { describe, expect, it, vi } from 'vitest'
import { EditableName } from '@renderer/atoms/EditableName/EditableName'

/**
 * DESIGN.md records that this atom is hand-written rather than composed,
 * because its affordance is an opacity reveal on a child and its focus rule
 * deliberately removes the ring. Both are exceptions to house rules, so both
 * want pinning: an undocumented exception reads as an oversight, and an
 * unasserted one gets "fixed" by the next person who reads the stylesheet.
 *
 * Enter commits and Escape reverts. Neither was asserted anywhere.
 */
describe('EditableName', () => {
  it('commits on Enter', async () => {
    const onCommit = vi.fn()
    const user = userEvent.setup()
    render(<EditableName value="core palette" onCommit={onCommit} ariaLabel="Palette name" />)

    // The field does not exist until the pen is pressed: at rest this is a span
    // plus a trigger, which is the opacity-reveal affordance DESIGN.md records.
    await user.click(screen.getByRole('button', { name: 'Rename Palette name' }))
    const field = screen.getByLabelText('Palette name')
    await user.clear(field)
    await user.type(field, 'brand palette{Enter}')

    expect(onCommit).toHaveBeenCalledWith('brand palette')
  })

  it('reverts on Escape, and does not commit', async () => {
    const onCommit = vi.fn()
    const user = userEvent.setup()
    render(<EditableName value="core palette" onCommit={onCommit} ariaLabel="Palette name" />)

    await user.click(screen.getByRole('button', { name: 'Rename Palette name' }))
    const field = screen.getByLabelText('Palette name')
    await user.clear(field)
    await user.type(field, 'discarded{Escape}')

    expect(onCommit).not.toHaveBeenCalled()
    // Escape leaves editing, so the name is back to a span showing the original.
    expect(screen.getByText('core palette')).toBeInTheDocument()
  })

  it('carries an accessible name even though it renders no visible label', async () => {
    const user = userEvent.setup()
    const { container } = render(<EditableName value="core palette" onCommit={vi.fn()} ariaLabel="Palette name" />)
    expect((await axe(container)).violations).toEqual([])

    // The reason `ariaLabel` is required rather than optional: without it the
    // field is unlabelled, which is what vault#30 is about elsewhere.
    await user.click(screen.getByRole('button', { name: 'Rename Palette name' }))
    expect(screen.getByLabelText('Palette name')).toBeInTheDocument()
    expect((await axe(container)).violations).toEqual([])
  })
})
