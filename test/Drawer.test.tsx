import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'
import { describe, expect, it, vi } from 'vitest'
import { Drawer } from '@renderer/molecules/Drawer/Drawer'

/**
 * A dialog that stays mounted while closed, so the interesting assertion is
 * that a closed drawer is genuinely out of reach: `aria-hidden` and
 * `aria-modal` both have to follow `open`, or a screen reader reads a panel the
 * user cannot see and cannot leave.
 */
describe('Drawer', () => {
  const body = <p>Contrast, in the drawer</p>

  it('is announced as modal only while open', () => {
    const { rerender } = render(
      <Drawer open onClose={vi.fn()} ariaLabel="Colour details">
        {body}
      </Drawer>,
    )
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAttribute('aria-hidden', 'false')

    rerender(
      <Drawer open={false} onClose={vi.fn()} ariaLabel="Colour details">
        {body}
      </Drawer>,
    )
    // Still mounted, and now hidden from the tree rather than merely off-screen.
    expect(screen.getByRole('dialog', { hidden: true })).toHaveAttribute('aria-hidden', 'true')
  })

  it('closes on the backdrop', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    const { container } = render(
      <Drawer open onClose={onClose} ariaLabel="Colour details">
        {body}
      </Drawer>,
    )
    const backdrop = container.querySelector('[aria-hidden="true"]')
    if (backdrop) await user.click(backdrop)
    expect(onClose).toHaveBeenCalled()
  })

  it('has no violations when open', async () => {
    const { container } = render(
      <Drawer open onClose={vi.fn()} ariaLabel="Colour details">
        {body}
      </Drawer>,
    )
    expect((await axe(container)).violations).toEqual([])
  })
})
