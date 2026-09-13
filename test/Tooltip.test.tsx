import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { Tooltip } from '@renderer/atoms/Tooltip/Tooltip'

/**
 * WCAG 1.4.13 Content on Hover or Focus asks for three things. This tooltip had
 * persistent and not the other two until 20a3c3f's successor: Escape did nothing,
 * and the bubble had pointer-events: none, so moving the pointer onto it closed
 * it. vault#46.
 */
describe('Tooltip', () => {
  it('opens on hover and names the trigger through aria-describedby', async () => {
    const user = userEvent.setup()
    render(
      <Tooltip label="Two colours share this name">
        <button type="button">Coral</button>
      </Tooltip>,
    )
    const trigger = screen.getByRole('button', { name: 'Coral' })
    await user.hover(trigger)

    const bubble = await screen.findByRole('tooltip')
    expect(bubble.textContent).toBe('Two colours share this name')
    expect(trigger.getAttribute('aria-describedby')).toBe(bubble.id)
  })

  it('dismisses on Escape without moving the pointer or focus', async () => {
    const user = userEvent.setup()
    render(
      <Tooltip label="Two colours share this name">
        <button type="button">Coral</button>
      </Tooltip>,
    )
    const trigger = screen.getByRole('button', { name: 'Coral' })
    await user.hover(trigger)
    await screen.findByRole('tooltip')

    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('tooltip')).toBeNull())

    // Focus has not moved, and the pointer is still over the trigger.
    expect(trigger.getAttribute('aria-describedby')).toBeNull()
  })

  it('stays open while the pointer moves onto the bubble', async () => {
    const user = userEvent.setup()
    render(
      <Tooltip label="Two colours share this name">
        <button type="button">Coral</button>
      </Tooltip>,
    )
    await user.hover(screen.getByRole('button', { name: 'Coral' }))
    const bubble = await screen.findByRole('tooltip')

    // Leaving the trigger starts a close; entering the bubble cancels it.
    await user.unhover(screen.getByRole('button', { name: 'Coral' }))
    await user.hover(bubble)
    await new Promise(r => setTimeout(r, 200))
    expect(screen.queryByRole('tooltip')).not.toBeNull()
  })

  it('closes once the pointer leaves both', async () => {
    const user = userEvent.setup()
    render(
      <Tooltip label="Two colours share this name">
        <button type="button">Coral</button>
      </Tooltip>,
    )
    await user.hover(screen.getByRole('button', { name: 'Coral' }))
    const bubble = await screen.findByRole('tooltip')
    await user.unhover(screen.getByRole('button', { name: 'Coral' }))
    await user.hover(bubble)
    await user.unhover(bubble)
    await waitFor(() => expect(screen.queryByRole('tooltip')).toBeNull())
  })
})
