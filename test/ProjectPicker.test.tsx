import React, { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { ProjectPicker } from '@renderer/molecules/ProjectPicker/ProjectPicker'
import { axe } from 'vitest-axe'

/**
 * The rows drew a tick and announced nothing: a screen reader heard "Brand
 * refresh, button" whether or not the project was on the item. vault#44. The
 * button form of MenuOption is a toggle now, so the tick and aria-pressed cannot
 * disagree.
 */
const TAGS = [
  { id: 1, label: 'Brand refresh', colour: '#8B1E3F' },
  { id: 2, label: 'Marketing site', colour: '#5B8DEF' },
]

function Harness({ single = false }: { single?: boolean }): React.ReactElement {
  const [ids, setIds] = useState<Set<number>>(new Set([1]))
  return (
    <ProjectPicker
      ariaLabel="Projects"
      allTags={TAGS as never}
      selectedIds={ids}
      onToggle={t =>
        setIds(prev => {
          const next = new Set(prev)
          if (next.has(t.id)) next.delete(t.id)
          else next.add(t.id)
          return next
        })
      }
      onCreateNew={() => {}}
      single={single}
    />
  )
}

describe('ProjectPicker', () => {
  // A selected project also has a chip with a "Remove <label>" control, so the
  // row is matched by its exact label rather than a substring.
  it('a row says whether its project is on the item', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(screen.getByRole('textbox', { name: 'Projects' }))

    expect(screen.getByRole('button', { name: 'Brand refresh' }).getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByRole('button', { name: 'Marketing site' }).getAttribute('aria-pressed')).toBe('false')
  })

  it('the announced state follows the tick when a row is toggled', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(screen.getByRole('textbox', { name: 'Projects' }))

    const row = screen.getByRole('button', { name: 'Marketing site' })
    await user.pointer({ keys: '[MouseLeft>]', target: row })
    expect(screen.getByRole('button', { name: 'Marketing site' }).getAttribute('aria-pressed')).toBe('true')
  })

  it('the create row is an action, not a toggle', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(screen.getByRole('textbox', { name: 'Projects' }))
    expect(screen.getByRole('button', { name: 'Create new project' }).getAttribute('aria-pressed')).toBeNull()
  })

  it('has no axe violations with the list open', async () => {
    const user = userEvent.setup()
    const { container } = render(<Harness />)
    await user.click(screen.getByRole('textbox', { name: 'Projects' }))
    expect((await axe(container)).violations).toEqual([])
  })
})
