import React from 'react'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'
import { describe, expect, it, vi } from 'vitest'
import { AddColorModal } from '@renderer/organisms/AddColorModal/AddColorModal'
import type { Colour } from '@shared/types'

/**
 * The image tab's drop zone was a div with a click handler, so a keyboard user
 * could not reach the one control that tab has. It is a button now. The name
 * chips showed which name was chosen by colour and a decorative tick alone; they
 * carry aria-pressed. A failed save wrote its message into the footer without
 * announcing it; it is an alert.
 */
const library: Colour[] = [{ id: 1, name: 'Existing', hex: '#123456', favourite: 0, created_at: '' }]

function setup(overrides: Partial<React.ComponentProps<typeof AddColorModal>> = {}) {
  const user = userEvent.setup()
  const props = {
    open: true,
    onClose: vi.fn(),
    library,
    onAdd: vi.fn(),
    onAddMany: vi.fn(),
    ...overrides,
  }
  render(<AddColorModal {...props} />)
  return { user, ...props }
}

describe('AddColorModal · from hex', () => {
  it('sets the hex in the mono field and marks the chosen name as pressed', async () => {
    const { user } = setup()
    const field = screen.getByRole('textbox', { name: 'Colour value' })
    await user.type(field, '#8B1E3F')

    const chips = within(screen.getByRole('group', { name: 'Name' })).getAllByRole('button')
    expect(chips.length).toBeGreaterThan(1)
    expect(chips.filter(c => c.getAttribute('aria-pressed') === 'true')).toHaveLength(1)

    await user.click(chips[1])
    expect(chips[1]).toHaveAttribute('aria-pressed', 'true')
    expect(chips[0]).toHaveAttribute('aria-pressed', 'false')
  })

  it('announces a failed save', async () => {
    const onAdd = vi.fn().mockRejectedValue(new Error('Database is locked'))
    const { user } = setup({ onAdd })
    await user.type(screen.getByRole('textbox', { name: 'Colour value' }), '#8B1E3F')
    await user.click(screen.getByRole('button', { name: 'Add colour' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Database is locked')
  })

  it('does not offer a picker for a fixed colour', () => {
    setup({ fixedHex: '#8B1E3F' })
    expect(screen.getByRole('button', { name: 'Swatch colour' })).toBeDisabled()
  })

  it('has no axe violations', async () => {
    const { user } = setup()
    await user.type(screen.getByRole('textbox', { name: 'Colour value' }), '#8B1E3F')
    expect((await axe(document.body)).violations).toEqual([])
  })
})

describe('AddColorModal · from image', () => {
  it('reaches the drop zone from the keyboard', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('radio', { name: 'From image' }))
    const zone = screen.getByRole('button', { name: /Drop an image here/ })
    zone.focus()
    expect(zone).toHaveFocus()
  })

  it('has no axe violations', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('radio', { name: 'From image' }))
    await waitFor(() => screen.getByRole('button', { name: /Drop an image here/ }))
    expect((await axe(document.body)).violations).toEqual([])
  })
})
