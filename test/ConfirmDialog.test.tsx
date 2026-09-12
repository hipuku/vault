import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ConfirmDialog } from '@renderer/molecules/ConfirmDialog/ConfirmDialog'
import { axe } from 'vitest-axe'

/**
 * Two of the app's seven confirms destroy nothing: "Can't delete" and "Can't
 * remove" report that something is in use. Until 90a5456 they drew a danger
 * button and a Cancel beside it that did the same thing. kind="alert" is the
 * difference, and these are the tests that keep it.
 */
describe('ConfirmDialog', () => {
  it('offers Cancel and a destructive confirm', () => {
    render(
      <ConfirmDialog
        open
        title="Delete “Ocean tonal”?"
        message="This colour will be removed from your library. This can’t be undone."
        confirmLabel="Delete colour"
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    )
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Delete colour' })).toBeTruthy()
  })

  it('an alert offers one button and nothing to cancel', () => {
    render(
      <ConfirmDialog
        open
        kind="alert"
        title="Can’t delete “Coral”"
        message="It’s used to build 2 palettes. Remove it from those palettes first."
        confirmLabel="OK"
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    )
    expect(screen.getByRole('button', { name: 'OK' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Cancel' })).toBeNull()
  })

  it('Enter does not fire the destructive action', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    render(
      <ConfirmDialog
        open
        title="Delete “Ocean tonal”?"
        message="This can’t be undone."
        onConfirm={onConfirm}
        onCancel={() => {}}
      />,
    )
    // Modal focuses the first control in the panel, which for chrome="plain" is
    // Cancel. Enter therefore does the safe thing by construction: the window
    // listener that used to delete from a stray keystroke is gone.
    await user.keyboard('{Enter}')
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('has no axe violations in either kind', async () => {
    const { container, rerender } = render(
      <ConfirmDialog
        open
        title="Delete “Ocean tonal”?"
        message="This can’t be undone."
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    )
    expect((await axe(container)).violations).toEqual([])

    rerender(
      <ConfirmDialog
        open
        kind="alert"
        title="Can’t delete “Coral”"
        message="It’s in use."
        confirmLabel="OK"
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    )
    expect((await axe(container)).violations).toEqual([])
  })
})
