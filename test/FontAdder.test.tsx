import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { FontAdder } from '@renderer/organisms/FontAdder/FontAdder'
import type { GoogleFontMeta } from '@shared/types'

/**
 * A failed add from the Google or Installed tab set an error that only the upload
 * tab's footer rendered, so the add failed and nothing on screen said so. The
 * upload drop zone was a div with a click handler, out of reach of a keyboard.
 */
vi.mock('@renderer/lib/fontLoader', async importOriginal => ({
  ...(await importOriginal<typeof import('@renderer/lib/fontLoader')>()),
  loadGoogleFont: vi.fn(),
}))

const inter = { family: 'Inter', category: 'sans-serif', weights: ['400', '700'], popularity: 1 } as GoogleFontMeta

beforeEach(() => {
  ;(window as unknown as { api: unknown }).api = {
    font: {
      googleList: vi.fn().mockResolvedValue([inter]),
      listInstalled: vi.fn().mockResolvedValue([]),
    },
    getPathForFile: vi.fn(),
  }
})

function setup(overrides: Partial<React.ComponentProps<typeof FontAdder>> = {}) {
  const user = userEvent.setup()
  const props = {
    open: true,
    onClose: vi.fn(),
    existing: new Set<string>(),
    onAddGoogle: vi.fn(),
    onAddLocal: vi.fn(),
    ...overrides,
  }
  render(<FontAdder {...props} />)
  return { user, ...props }
}

describe('FontAdder', () => {
  it('says so when adding from Google fails', async () => {
    const onAddGoogle = vi.fn().mockRejectedValue(new Error('Could not write the font'))
    const { user } = setup({ onAddGoogle })
    await user.click(await screen.findByRole('button', { name: 'Add' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not write the font')
  })

  it('reaches the upload drop zone from the keyboard', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('radio', { name: 'Upload file' }))
    const zone = screen.getByRole('button', { name: /Drop font files/ })
    zone.focus()
    expect(zone).toHaveFocus()
  })

  it('has no axe violations on the Google tab', async () => {
    setup()
    await screen.findByRole('button', { name: 'Add' })
    expect((await axe(document.body)).violations).toEqual([])
  })

  it('has no axe violations on the upload tab', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('radio', { name: 'Upload file' }))
    expect((await axe(document.body)).violations).toEqual([])
  })
})
