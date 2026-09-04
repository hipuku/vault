import React from 'react'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'
import { describe, expect, it, vi } from 'vitest'
import { CommandPalette, type Command } from '@renderer/organisms/CommandPalette/CommandPalette'

/**
 * The palette is a combobox driving a listbox through `aria-activedescendant`,
 * which is why DESIGN.md excludes it from both Modal and MenuOption. That
 * exclusion is only defensible if the pattern it was excluded for actually
 * works, and nothing asserted it.
 *
 * The interesting property is that focus never leaves the input. Assertions
 * that follow `document.activeElement` down the list would pass against a
 * roving-tabindex implementation and prove nothing about this one.
 */

const cmd = (label: string, run = vi.fn()): Command => ({
  id: label.toLowerCase(),
  label,
  run,
})

function open(commands: Command[], onClose = vi.fn()) {
  const user = userEvent.setup()
  render(<CommandPalette open commands={commands} onClose={onClose} />)
  return { user, onClose }
}

const input = () => screen.getByRole('combobox')
const options = () => within(screen.getByRole('listbox')).getAllByRole('option')
const active = () => {
  const id = input().getAttribute('aria-activedescendant')
  return options().find(o => o.id === id)
}

describe('CommandPalette', () => {
  it('points the input at the first option', () => {
    open([cmd('Colours'), cmd('Fonts'), cmd('Palettes')])
    expect(active()).toHaveTextContent('Colours')
    expect(active()).toHaveAttribute('aria-selected', 'true')
  })

  it('moves the active option with the arrows, and keeps focus on the input', async () => {
    const { user } = open([cmd('Colours'), cmd('Fonts'), cmd('Palettes')])
    await user.keyboard('{ArrowDown}')
    expect(active()).toHaveTextContent('Fonts')
    // The whole point of activedescendant: the input never gives up focus.
    expect(input()).toHaveFocus()

    await user.keyboard('{ArrowUp}')
    expect(active()).toHaveTextContent('Colours')
    expect(input()).toHaveFocus()
  })

  it('runs the active command on Enter, not the first one', async () => {
    const first = vi.fn()
    const second = vi.fn()
    const { user } = open([cmd('Colours', first), cmd('Fonts', second)])
    await user.keyboard('{ArrowDown}{Enter}')
    expect(second).toHaveBeenCalledTimes(1)
    expect(first).not.toHaveBeenCalled()
  })

  it('closes on Escape', async () => {
    const { user, onClose } = open([cmd('Colours')])
    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalled()
  })

  it('filters as you type, and the active option follows the filtered list', async () => {
    const { user } = open([cmd('Colours'), cmd('Fonts'), cmd('Palettes')])
    await user.type(input(), 'fon')
    expect(options()).toHaveLength(1)
    // Not left pointing at an option that is no longer rendered.
    expect(active()).toHaveTextContent('Fonts')
  })

  it('has no violations', async () => {
    const { container } = render(<CommandPalette open commands={[cmd('Colours'), cmd('Fonts')]} onClose={vi.fn()} />)
    expect((await axe(container)).violations).toEqual([])
  })
})
