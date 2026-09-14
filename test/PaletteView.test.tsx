import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PaletteView } from '@renderer/organisms/PaletteView/PaletteView'
import type { Palette, Swatch } from '@shared/types'

/**
 * Each swatch's "Save to library" was a glyph over the colour, revealed only on
 * hover, and every one was named the same. It is an IconButton under the swatch
 * now, revealed on focus as well, and named for the colour it saves. A swatch
 * already in the library said so only through a title; it is a named image.
 */
beforeEach(() => {
  ;(window as unknown as { api: unknown }).api = {
    tag: { listForAsset: vi.fn().mockResolvedValue([]) },
    colour: { list: vi.fn().mockResolvedValue([]) },
  }
})

const palette: Palette = {
  id: 1,
  name: 'Ocean',
  kind: 'expressive',
  base_hex: '#1E5B8B',
  gen_params: '{}',
  favourite: 0,
  created_at: '',
  updated_at: '',
}
const swatches: Swatch[] = [
  ['#DCE8F2', 'light', null],
  ['#1E5B8B', '', 4],
  ['#0B2236', 'dark', null],
].map(([hex, label, colour_id], i) => ({
  id: i + 1,
  palette_id: 1,
  hex: hex as string,
  label: label as string,
  group_key: 'blue',
  colour_id: colour_id as number | null,
  sort_order: i,
  locked: 0,
  created_at: '',
}))

function setup() {
  const user = userEvent.setup()
  render(
    <main>
      <PaletteView
        palette={palette}
        swatches={swatches}
        onBack={vi.fn()}
        onRename={vi.fn()}
        onDelete={vi.fn()}
        onPromote={vi.fn().mockResolvedValue(undefined)}
      />
    </main>,
  )
  return { user }
}

describe('PaletteView', () => {
  it('names each save action for its colour, and marks what is already saved', async () => {
    setup()
    await waitFor(() => expect(window.api.colour.list).toHaveBeenCalled())
    expect(screen.getByRole('button', { name: 'Save #DCE8F2 to library' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save #0B2236 to library' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Save #1E5B8B to library' })).toBeNull()
    expect(screen.getByRole('img', { name: 'In library' })).toBeInTheDocument()
  })

  it('opens the save dialog with the colour fixed', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: 'Save #DCE8F2 to library' }))
    expect(screen.getByRole('dialog', { name: 'Save to library' })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Colour value' })).toHaveValue('#DCE8F2')
  })

  it('has no axe violations', async () => {
    setup()
    await waitFor(() => expect(window.api.colour.list).toHaveBeenCalled())
    expect((await axe(document.body)).violations).toEqual([])
  })
})
