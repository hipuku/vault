import React, { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Select } from '@renderer/molecules/Select/Select'

/**
 * Select replaced a native <select> and for a long time kept none of what the native
 * control gave away. ArrowDown appeared in exactly one file in this repo before this,
 * CommandPalette, and Select fronts nine call sites across the toolbar, the units
 * control, the font adder and the type scale creator.
 *
 * The structural half matters as much as the keys: role="option" has to be a direct
 * child of the listbox, which is only possible because focus stays on the trigger.
 */
const OPTIONS = [
  { key: 'name', label: 'Name' },
  { key: 'recent', label: 'Recent' },
  { key: 'hue', label: 'Hue' },
  { key: 'hex', label: 'Hex' },
] as const

type Key = (typeof OPTIONS)[number]['key']

function Harness({ onChange = () => {} }: { onChange?: (k: Key) => void }): React.ReactElement {
  const [value, setValue] = useState<Key>('recent')
  return (
    <Select
      ariaLabel="Sort"
      value={value}
      options={OPTIONS}
      onChange={k => {
        setValue(k)
        onChange(k)
      }}
    />
  )
}

const trigger = (): HTMLElement => screen.getByRole('combobox', { name: 'Sort' })
const active = (): string | undefined =>
  document.getElementById(trigger().getAttribute('aria-activedescendant') ?? '')?.textContent ??
  undefined

describe('Select', () => {
  it('keeps every option a direct child of the listbox', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(trigger())

    const list = screen.getByRole('listbox')
    for (const option of screen.getAllByRole('option')) {
      expect(option.parentElement).toBe(list)
      // Anything focusable in between would make the structure invalid again.
      expect(option.tagName).toBe('LI')
    }
  })

  it('opens on ArrowDown and starts on the current selection', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    trigger().focus()

    await user.keyboard('{ArrowDown}')
    expect(screen.getByRole('listbox')).toBeTruthy()
    expect(active()).toContain('Recent')

    await user.keyboard('{ArrowDown}')
    expect(active()).toContain('Hue')
    await user.keyboard('{ArrowUp}')
    expect(active()).toContain('Recent')
  })

  it('stops at the ends rather than wrapping, and Home and End reach them', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    trigger().focus()

    await user.keyboard('{ArrowDown}{ArrowUp}{ArrowUp}{ArrowUp}')
    expect(active()).toContain('Name')
    await user.keyboard('{End}')
    expect(active()).toContain('Hex')
    await user.keyboard('{ArrowDown}')
    expect(active()).toContain('Hex')
    await user.keyboard('{Home}')
    expect(active()).toContain('Name')
  })

  it('commits the active option on Enter and closes', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Harness onChange={onChange} />)
    trigger().focus()

    await user.keyboard('{ArrowDown}{ArrowDown}{Enter}')
    expect(onChange).toHaveBeenCalledWith('hue')
    expect(screen.queryByRole('listbox')).toBeNull()
    expect(trigger().textContent).toContain('Hue')
  })

  it('cycles the options starting with a repeated letter', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    trigger().focus()
    await user.keyboard('{ArrowDown}')

    await user.keyboard('h')
    expect(active()).toContain('Hue')
    // The same letter again moves on, the way a native select does, rather than
    // searching for "hh" and finding nothing.
    await user.keyboard('h')
    expect(active()).toContain('Hex')
    await user.keyboard('h')
    expect(active()).toContain('Hue')
  })

  it('treats a run of different letters as one prefix', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    trigger().focus()
    await user.keyboard('{ArrowDown}')

    // Hue and Hex share their first letter, so the second is what separates them.
    await user.keyboard('he')
    expect(active()).toContain('Hex')
  })

  it('leaves the value alone on Escape', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Harness onChange={onChange} />)
    trigger().focus()

    await user.keyboard('{ArrowDown}{ArrowDown}{Escape}')
    expect(screen.queryByRole('listbox')).toBeNull()
    expect(onChange).not.toHaveBeenCalled()
  })

  it('never moves DOM focus off the trigger while open', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    trigger().focus()

    await user.keyboard('{ArrowDown}{ArrowDown}{End}')
    // The whole pattern rests on this: the options are announced through
    // aria-activedescendant precisely because they cannot hold focus themselves.
    expect(document.activeElement).toBe(trigger())
  })
})
