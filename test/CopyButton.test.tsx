import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { CopyButton } from '@renderer/molecules/CopyButton/CopyButton'
import { axe } from 'vitest-axe'

/**
 * The chip flipped to "Copied" with a tick and announced nothing: a screen reader
 * user pressed it and got no confirmation that the clipboard had been written.
 * The label is a polite live region now.
 */
beforeEach(() => {
  ;(window as unknown as { api: { clipboard: { write: (t: string) => void } } }).api = {
    clipboard: { write: vi.fn() },
  }
})

describe('CopyButton', () => {
  it('names the action and the value together', () => {
    render(<CopyButton value="#8B1E3F" label="#8B1E3F" />)
    expect(screen.getByRole('button', { name: 'Copy #8B1E3F' })).toBeTruthy()
  })

  it('writes the value and announces the copy politely', async () => {
    const user = userEvent.setup()
    render(<CopyButton value="#8B1E3F" label="#8B1E3F" />)

    const label = screen.getByText('#8B1E3F')
    expect(label.getAttribute('aria-live')).toBe('polite')

    await user.click(screen.getByRole('button', { name: 'Copy #8B1E3F' }))
    expect(window.api.clipboard.write).toHaveBeenCalledWith('#8B1E3F')
    await waitFor(() => expect(screen.getByText('Copied')).toBeTruthy())
    // The same element changed, which is what makes it an announcement.
    expect(screen.getByText('Copied').getAttribute('aria-live')).toBe('polite')
  })

  it('falls back to the value when no label is given', () => {
    render(<CopyButton value="rgb(139, 30, 63)" />)
    expect(screen.getByRole('button', { name: 'Copy rgb(139, 30, 63)' })).toBeTruthy()
  })

  it('has no axe violations', async () => {
    const { container } = render(<CopyButton value="#8B1E3F" label="#8B1E3F" />)
    expect((await axe(container)).violations).toEqual([])
  })
})
