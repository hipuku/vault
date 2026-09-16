import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { Sidebar } from '@renderer/organisms/Sidebar/Sidebar'
import type { TagWithCount } from '@shared/types'

/**
 * The navigation rail. It is the app's only landmark nav, so the row you are on
 * is announced as the current page rather than only drawn differently, and every
 * project's edit and delete buttons are named for that project.
 */
const tags: TagWithCount[] = [
  { id: 1, label: 'Brand refresh', colour: '#C26E89', count: 4 },
  { id: 2, label: 'Marketing site', colour: '#1E5B8B', count: 0 },
]

function setup(overrides: Partial<React.ComponentProps<typeof Sidebar>> = {}) {
  const props = {
    activeSection: 'colours' as const,
    onSectionChange: vi.fn(),
    activeTagId: null,
    onTagSelect: vi.fn(),
    tags,
    createTag: vi.fn(),
    updateTag: vi.fn(),
    deleteTag: vi.fn(),
    ...overrides,
  }
  return { props, ...render(<Sidebar {...props} />) }
}

describe('Sidebar', () => {
  it('names the rail and marks the active section as the current page', () => {
    setup()
    expect(screen.getByRole('navigation', { name: 'Sections and projects' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Colors' }).getAttribute('aria-current')).toBe('page')
    expect(screen.getByRole('button', { name: 'Fonts' }).getAttribute('aria-current')).toBeNull()
  })

  it('marks the open project as current, and no section with it', () => {
    setup({ activeSection: null, activeTagId: 1 })
    expect(screen.getByRole('button', { name: 'Brand refresh' }).getAttribute('aria-current')).toBe('page')
    expect(screen.getByRole('button', { name: 'Colors' }).getAttribute('aria-current')).toBeNull()
  })

  it('names each project row action for its project', () => {
    setup()
    expect(screen.getByRole('button', { name: 'Edit project Brand refresh' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Delete project Marketing site' })).toBeTruthy()
  })

  it('selects a section, and toggles a project off when it is already open', async () => {
    const user = userEvent.setup()
    const { props } = setup({ activeTagId: 1 })
    await user.click(screen.getByRole('button', { name: 'Fonts' }))
    expect(props.onSectionChange).toHaveBeenCalledWith('fonts')
    await user.click(screen.getByRole('button', { name: 'Brand refresh' }))
    expect(props.onTagSelect).toHaveBeenCalledWith(null)
  })

  it('hides the projects list until there is a project', () => {
    setup({ tags: [] })
    expect(screen.queryByText('Projects')).toBeNull()
    expect(screen.getByRole('button', { name: 'Add project' })).toBeTruthy()
  })

  it('has no accessibility violations', async () => {
    const { container } = setup()
    expect((await axe(container)).violations).toEqual([])
  })
})
