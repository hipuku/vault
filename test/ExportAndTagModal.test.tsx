import React from 'react'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ExportModal } from '@renderer/organisms/ExportModal/ExportModal'
import { TagModal } from '@renderer/organisms/TagModal/TagModal'

beforeEach(() => {
  ;(window as unknown as { api: unknown }).api = { clipboard: { write: vi.fn() } }
})

/**
 * ExportModal's code preview scrolls both ways and could not take focus, so a
 * keyboard could not scroll it; and the Copy button's flip to Copied was silent.
 */
describe('ExportModal', () => {
  const formats = [
    { id: 'css', label: 'CSS', ext: 'css' },
    { id: 'json', label: 'JSON', ext: 'json' },
  ]
  const renderIt = () =>
    render(
      <ExportModal
        open
        onClose={vi.fn()}
        title="Ocean"
        formats={formats}
        generate={f => `/* ${f} */`}
        filenameBase="Ocean"
      />,
    )

  it('lets a keyboard reach the scrolling preview, named for its format', async () => {
    const user = userEvent.setup()
    renderIt()
    const preview = screen.getByLabelText('CSS preview')
    expect(preview).toHaveAttribute('tabindex', '0')
    await user.click(screen.getByRole('radio', { name: 'JSON' }))
    expect(screen.getByLabelText('JSON preview')).toHaveTextContent('/* json */')
  })

  it('announces the copy', async () => {
    const user = userEvent.setup()
    renderIt()
    await user.click(screen.getByRole('button', { name: /Copy/ }))
    expect(screen.getByText('Copied').closest('[aria-live]')).toHaveAttribute('aria-live', 'polite')
  })

  it('has no axe violations', async () => {
    renderIt()
    expect((await axe(document.body)).violations).toEqual([])
  })
})

/** TagModal's colours showed the chosen one by a ring alone; they are toggles now. */
describe('TagModal', () => {
  it('marks the chosen colour as pressed', async () => {
    const user = userEvent.setup()
    render(<TagModal open mode="create" onSubmit={vi.fn()} onClose={vi.fn()} />)
    const swatches = within(screen.getByRole('group', { name: 'Project colour' })).getAllByRole('button')
    expect(swatches[0]).toHaveAttribute('aria-pressed', 'true')
    await user.click(swatches[2])
    expect(swatches[2]).toHaveAttribute('aria-pressed', 'true')
    expect(swatches[0]).toHaveAttribute('aria-pressed', 'false')
  })

  it('names each colour for its hue, numbered where hues repeat', () => {
    render(<TagModal open mode="create" onSubmit={vi.fn()} onClose={vi.fn()} />)
    const names = within(screen.getByRole('group', { name: 'Project colour' }))
      .getAllByRole('button')
      .map(b => b.getAttribute('aria-label'))
    expect(names).toEqual([
      'Pink',
      'Red',
      'Orange',
      'Yellow',
      'Green 1',
      'Green 2',
      'Cyan',
      'Blue 1',
      'Blue 2',
      'Blue 3',
      'Purple 1',
      'Purple 2',
    ])
  })

  it('has no axe violations', async () => {
    render(<TagModal open mode="create" onSubmit={vi.fn()} onClose={vi.fn()} />)
    expect((await axe(document.body)).violations).toEqual([])
  })
})
