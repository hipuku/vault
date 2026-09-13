import React, { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { SegmentedControl } from '@renderer/atoms/SegmentedControl/SegmentedControl'
import { axe } from 'vitest-axe'

/**
 * It rendered role="tablist" with role="tab" segments and none of what tabs
 * promise: no panels, no aria-controls, no arrow keys, and every segment its own
 * Tab stop. vault#45. Every use is a single choice from a set, so it is a radio
 * group, and these are the tests that hold it to that.
 */
const OPTIONS = [
  { id: 'css', label: 'CSS' },
  { id: 'scss', label: 'SCSS' },
  { id: 'tokens', label: 'Design Tokens' },
]

function Harness(): React.ReactElement {
  const [value, setValue] = useState('css')
  return <SegmentedControl ariaLabel="Export format" options={OPTIONS} value={value} onChange={setValue} />
}

describe('SegmentedControl', () => {
  it('is a radio group, not a tablist', () => {
    render(<Harness />)
    expect(screen.getByRole('radiogroup', { name: 'Export format' })).toBeTruthy()
    expect(screen.queryByRole('tablist')).toBeNull()
    expect(screen.getAllByRole('radio')).toHaveLength(3)
    expect(screen.getByRole('radio', { name: 'CSS' }).getAttribute('aria-checked')).toBe('true')
  })

  it('is one Tab stop, on the chosen segment', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.tab()
    expect(document.activeElement).toBe(screen.getByRole('radio', { name: 'CSS' }))

    // The other two are out of the tab order, so Tab leaves the group.
    await user.tab()
    expect(document.activeElement).not.toBe(screen.getByRole('radio', { name: 'SCSS' }))
  })

  it('arrows move and choose, and wrap', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.tab()

    await user.keyboard('{ArrowRight}')
    expect(screen.getByRole('radio', { name: 'SCSS' }).getAttribute('aria-checked')).toBe('true')
    expect(document.activeElement).toBe(screen.getByRole('radio', { name: 'SCSS' }))

    await user.keyboard('{ArrowRight}{ArrowRight}')
    expect(screen.getByRole('radio', { name: 'CSS' }).getAttribute('aria-checked')).toBe('true')

    await user.keyboard('{ArrowLeft}')
    expect(screen.getByRole('radio', { name: 'Design Tokens' }).getAttribute('aria-checked')).toBe('true')

    await user.keyboard('{Home}')
    expect(screen.getByRole('radio', { name: 'CSS' }).getAttribute('aria-checked')).toBe('true')
    await user.keyboard('{End}')
    expect(screen.getByRole('radio', { name: 'Design Tokens' }).getAttribute('aria-checked')).toBe('true')
  })

  it('has no axe violations', async () => {
    const { container } = render(<Harness />)
    expect((await axe(container)).violations).toEqual([])
  })
})
