import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ColorDrawer } from '@renderer/organisms/ColorDrawer/ColorDrawer'
import { FontDrawer } from '@renderer/organisms/FontDrawer/FontDrawer'
import type { Colour, Font } from '@shared/types'

/**
 * ColorDrawer drew its rename field and pen by hand, and the pen sat at width 0
 * and opacity 0 until the row was hovered, so a keyboard user tabbed onto a
 * button, and a focus ring, they could not see. The same was true of each
 * suggested name's "Use" button. The rename is InlineEdit now, and both reveal
 * on focus as well as hover.
 */
beforeEach(() => {
  ;(window as unknown as { api: unknown }).api = {
    tag: {
      list: vi.fn().mockResolvedValue([]),
      listForAsset: vi.fn().mockResolvedValue([]),
      assign: vi.fn(),
      remove: vi.fn(),
      create: vi.fn(),
    },
    clipboard: { write: vi.fn() },
    font: { reveal: vi.fn(), downloadGoogle: vi.fn() },
  }
})

const colour: Colour = { id: 7, name: 'Raspberry', hex: '#8B1E3F', favourite: 0, created_at: '' }

function renderColour(onRename = vi.fn()): ReturnType<typeof render> {
  return render(
    <ColorDrawer
      colour={colour}
      library={[colour]}
      onClose={vi.fn()}
      onRename={onRename}
      onToggleFavourite={vi.fn()}
      onDelete={vi.fn()}
    />,
  )
}

describe('ColorDrawer', () => {
  it('renames through InlineEdit', async () => {
    const onRename = vi.fn()
    const user = userEvent.setup()
    renderColour(onRename)

    await user.click(screen.getByRole('button', { name: 'Rename colour name' }))
    const field = screen.getByRole('textbox', { name: 'colour name' })
    await user.clear(field)
    await user.type(field, 'Claret{Enter}')

    expect(onRename).toHaveBeenCalledWith(7, 'Claret')
  })

  it('applies a suggested name from its own button', async () => {
    const onRename = vi.fn()
    const user = userEvent.setup()
    renderColour(onRename)

    const use = screen.getAllByRole('button', { name: /^Use “/ })
    expect(use.length).toBeGreaterThan(0)
    await user.click(use[0])
    expect(onRename).toHaveBeenCalledTimes(1)
    expect(onRename.mock.calls[0][0]).toBe(7)
  })

  it('has no axe violations', async () => {
    const { container } = renderColour()
    await waitFor(() => expect(window.api.tag.listForAsset).toHaveBeenCalled())
    expect((await axe(container)).violations).toEqual([])
  })
})

const font: Font = {
  id: 3,
  family: 'Inter',
  category: 'sans-serif',
  source: 'local',
  source_url: '',
  weights: '["400","700"]',
  favourite: 1,
  created_at: '',
}

describe('FontDrawer', () => {
  it('has no axe violations', async () => {
    const { container } = render(
      <FontDrawer
        font={font}
        previewText=""
        previewSize={24}
        onClose={vi.fn()}
        onToggleFavourite={vi.fn()}
        onDelete={vi.fn()}
      />,
    )
    await waitFor(() => expect(window.api.tag.listForAsset).toHaveBeenCalled())
    expect((await axe(container)).violations).toEqual([])
  })

  it('marks the favourite as a pressed toggle', () => {
    render(
      <FontDrawer
        font={font}
        previewText=""
        previewSize={24}
        onClose={vi.fn()}
        onToggleFavourite={vi.fn()}
        onDelete={vi.fn()}
      />,
    )
    expect(screen.getByRole('button', { name: 'Unfavourite' })).toHaveAttribute('aria-pressed', 'true')
  })
})
