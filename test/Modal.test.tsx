import React, { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import Modal from '@renderer/molecules/Modal/Modal'

/**
 * useFocusTrap's own docstring says it: every hand-rolled copy of this shell handled
 * Escape and none of them trapped focus or gave it back. Modal and Drawer are the two
 * that use it, and until this file there was no test of either in this repo.
 */
function Harness({
  onClose = () => {},
  open = true,
}: {
  onClose?: () => void
  open?: boolean
}): React.ReactElement {
  return (
    <>
      <button type="button">behind</button>
      <Modal open={open} onClose={onClose} title="Add colour">
        <input aria-label="name" />
        <button type="button">save</button>
      </Modal>
    </>
  )
}

describe('Modal', () => {
  it('names the dialog by its rendered heading', () => {
    render(<Harness />)
    const dialog = screen.getByRole('dialog', { name: 'Add colour' })
    expect(dialog.getAttribute('aria-labelledby')).toBe(
      screen.getByRole('heading', { name: 'Add colour' }).id,
    )
  })

  it('focuses into the panel and keeps Tab inside it', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    // The first focusable thing in the panel, which for a chromed modal is the
    // header's close button rather than the first field: the header is rendered
    // before the body.
    const close = screen.getByRole('button', { name: 'Close' })
    expect(document.activeElement).toBe(close)

    await user.tab()
    expect(document.activeElement).toBe(screen.getByLabelText('name'))
    await user.tab()
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'save' }))
    await user.tab()
    // Past the last item focus wraps rather than reaching "behind".
    expect(document.activeElement).toBe(close)
  })

  it('gives focus back to the opener when it closes', async () => {
    const user = userEvent.setup()
    const { rerender } = render(<Harness open={false} />)
    const opener = screen.getByRole('button', { name: 'behind' })
    opener.focus()

    rerender(<Harness open={true} />)
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Close' }))

    rerender(<Harness open={false} />)
    expect(document.activeElement).toBe(opener)
    await user.tab()
  })

  it('closes on Escape', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<Harness onClose={onClose} />)
    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalled()
  })

  it('holds focus where the user put it while the parent re-renders', async () => {
    // Every caller passes an inline arrow for onClose, so it is a new function on
    // each render of the parent. Handed straight to the trap, that tears the effect
    // down and sets it up again, which re-runs "focus the first field" and undoes
    // the cleanup's "give focus back to the opener" — mid-typing.
    function Parent(): React.ReactElement {
      const [count, setCount] = useState(0)
      return (
        <Modal open onClose={() => setCount(0)} title="Add colour">
          <input aria-label="name" />
          <button type="button" onClick={() => setCount(c => c + 1)}>
            bump {count}
          </button>
        </Modal>
      )
    }
    const user = userEvent.setup()
    render(<Parent />)

    const bump = screen.getByRole('button', { name: /bump/ })
    bump.focus()
    await user.click(bump)

    expect(document.activeElement).toBe(screen.getByRole('button', { name: /bump/ }))
  })
})
