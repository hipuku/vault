import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { PaletteCreate } from '@renderer/organisms/PaletteCreate/PaletteCreate'
import type { Colour, Palette, Tag } from '@shared/types'

/**
 * The palette generators, which vault#19 filed as the hardest logic here and
 * the least covered.
 *
 * The generators themselves: `generateTonalSystem`, `generateExpressiveSet`
 *, already have domain tests, and this is not those. What had nothing was the
 * screen that decides *what to hand them*: which colours are eligible, how many
 * hue groups is a legal request, which ramps a caller is allowed to turn off,
 * and whether the create button is reachable at all. Every one of those is a
 * rule that lives only in this component, and the issue's own evidence is that
 * a crash making the app unlaunchable passed all five CI jobs, because 162
 * tests of pure functions cannot see a screen.
 */

const COLOURS: Colour[] = [
  { id: 1, name: 'Aronia', hex: '#7653ab' },
  { id: 2, name: 'Cherry', hex: '#d73431' },
  { id: 3, name: 'Mango', hex: '#c46300' },
  { id: 4, name: 'Greengage', hex: '#009630' },
  { id: 5, name: 'Elderberry', hex: '#3665e4' },
  { id: 6, name: 'Damson', hex: '#111113' },
] as unknown as Colour[]

const PROJECT: Tag = { id: 10, label: 'Brand', colour: '#7653ab' } as unknown as Tag

/** Only what this component reaches for. Anything else should fail loudly. */
function stubApi(memberIds: number[] = COLOURS.map(c => c.id)) {
  const api = {
    tag: {
      list: vi.fn().mockResolvedValue([{ ...PROJECT, count: memberIds.length }]),
      listAssetIds: vi.fn().mockResolvedValue(memberIds),
      create: vi.fn().mockResolvedValue({ ...PROJECT, id: 11, label: 'New' }),
      assign: vi.fn().mockResolvedValue(undefined),
    },
  }
  ;(globalThis as unknown as { window: { api: unknown } }).window.api = api
  return api
}

const PALETTE = { id: 99, name: 'Made' } as unknown as Palette

function setup(overrides: Partial<React.ComponentProps<typeof PaletteCreate>> = {}) {
  const onCancel = vi.fn()
  const onCreateTonal = vi.fn().mockResolvedValue(PALETTE)
  const onCreateExpressive = vi.fn().mockResolvedValue(PALETTE)
  const user = userEvent.setup()
  render(
    // Wrapped in <main> because axe's `region` rule wants every node inside a
    // landmark, and in the app this screen renders inside one. Without it the
    // suite would report a violation the component cannot fix.
    <main>
    <PaletteCreate
      library={COLOURS}
      onCancel={onCancel}
      onCreateTonal={onCreateTonal}
      onCreateExpressive={onCreateExpressive}
      {...overrides}
    />
    </main>,
  )
  return { user, onCancel, onCreateTonal, onCreateExpressive }
}

/** Pick the one project, which is what unlocks the seed grid. */
async function chooseProject(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByPlaceholderText('Choose a project…'))
  await user.click(await screen.findByText('Brand'))
}

const seedButton = (name: string) => screen.getByRole('button', { name: new RegExp(name) })
const createButton = () => screen.getByRole('button', { name: /Create palette|Creating/ })

beforeEach(() => { stubApi() })
afterEach(() => { vi.restoreAllMocks() })

describe('PaletteCreate · what it will let you ask for', () => {
  it('cannot create without a name, however many seeds are picked', async () => {
    const { user } = setup()
    await chooseProject(user)
    await user.click(seedButton('Aronia'))
    expect(createButton()).toBeDisabled()
  })

  it('cannot create without a seed, however good the name is', async () => {
    const { user } = setup()
    await user.type(screen.getByPlaceholderText('Palette name'), 'Brand ramp')
    expect(createButton()).toBeDisabled()
  })

  it('treats a name of only spaces as no name', async () => {
    const { user } = setup()
    await chooseProject(user)
    await user.click(seedButton('Aronia'))
    await user.type(screen.getByPlaceholderText('Palette name'), '   ')
    expect(createButton()).toBeDisabled()
  })

  it('shows no colours at all until a project is chosen', async () => {
    // Not an empty library: the library has six. `scopedColours` is [] while
    // projectColourIds is null, so the whole grid is gated behind the project
    // picker. Worth pinning because it reads like a bug until you find the line.
    setup()
    expect(screen.getByText('Choose a project to pick seed colours from.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Aronia/ })).toBeNull()
  })

  it('says so when the chosen project has no colours in it', async () => {
    stubApi([])
    const { user } = setup()
    await chooseProject(user)
    expect(
      await screen.findByText('This project has no colours yet. Add colours to it from the Colors page.'),
    ).toBeInTheDocument()
  })

  it('offers only the colours in the chosen project, not the whole library', async () => {
    stubApi([1, 2])
    const { user } = setup()
    await chooseProject(user)
    expect(await screen.findByRole('button', { name: /Aronia/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Mango/ })).toBeNull()
  })
})

describe('PaletteCreate · tonal', () => {
  it('takes one seed, and clicking it again takes it back', async () => {
    const { user } = setup()
    await chooseProject(user)
    await user.click(await screen.findByRole('button', { name: /Aronia/ }))
    expect(seedButton('Aronia')).toHaveAttribute('aria-pressed', 'true')

    await user.click(seedButton('Aronia'))
    expect(seedButton('Aronia')).toHaveAttribute('aria-pressed', 'false')
  })

  it('replaces the seed rather than accumulating them', async () => {
    const { user } = setup()
    await chooseProject(user)
    await user.click(await screen.findByRole('button', { name: /Aronia/ }))
    await user.click(seedButton('Cherry'))

    expect(seedButton('Aronia')).toHaveAttribute('aria-pressed', 'false')
    expect(seedButton('Cherry')).toHaveAttribute('aria-pressed', 'true')
  })

  it('will not let primary or neutral be turned off', async () => {
    // Every tonal system has both. The checkboxes are rendered so the set is
    // visible rather than implied, and disabled so it cannot be broken.
    setup()
    expect(screen.getByRole('checkbox', { name: 'Primary' })).toBeDisabled()
    expect(screen.getByRole('checkbox', { name: 'Neutral' })).toBeDisabled()
    expect(screen.getByRole('checkbox', { name: 'Primary' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Neutral' })).toBeChecked()
  })

  it('starts with the optional ramps off and toggles them', async () => {
    const { user } = setup()
    const success = screen.getByRole('checkbox', { name: 'Success' })
    expect(success).not.toBeChecked()

    await user.click(success)
    expect(success).toBeChecked()
    await user.click(success)
    expect(success).not.toBeChecked()
  })

  it('hands the generator the ramps in a fixed order, not click order', async () => {
    // ALL_RAMPS.filter(), not [...ramps]: a Set iterates in insertion order, so
    // turning error on before warning would otherwise reorder the palette.
    const { user, onCreateTonal } = setup()
    await chooseProject(user)
    await user.type(screen.getByPlaceholderText('Palette name'), 'Brand')
    await user.click(await screen.findByRole('button', { name: /Aronia/ }))
    await user.click(screen.getByRole('checkbox', { name: 'Error' }))
    await user.click(screen.getByRole('checkbox', { name: 'Warning' }))
    await user.click(createButton())

    await waitFor(() =>
      expect(onCreateTonal).toHaveBeenCalledWith('Brand', '#7653ab', 1, [
        'primary', 'neutral', 'warning', 'error',
      ]),
    )
  })

  it('trims the name before it reaches the generator', async () => {
    const { user, onCreateTonal } = setup()
    await chooseProject(user)
    await user.type(screen.getByPlaceholderText('Palette name'), '  Brand  ')
    await user.click(await screen.findByRole('button', { name: /Aronia/ }))
    await user.click(createButton())
    await waitFor(() => expect(onCreateTonal.mock.calls[0][0]).toBe('Brand'))
  })
})

describe('PaletteCreate · expressive', () => {
  // SegmentedControl is a tablist, not a group of buttons.
  const toExpressive = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.click(screen.getByRole('tab', { name: 'Expressive Set' }))
  }

  it('accumulates seeds rather than replacing them', async () => {
    const { user } = setup()
    await chooseProject(user)
    await toExpressive(user)
    await user.click(await screen.findByRole('button', { name: /Aronia/ }))
    await user.click(seedButton('Cherry'))

    expect(seedButton('Aronia')).toHaveAttribute('aria-pressed', 'true')
    expect(seedButton('Cherry')).toHaveAttribute('aria-pressed', 'true')
  })

  it('raises the hue-group count to match the seeds when it is behind them', async () => {
    // The clamp: Math.max(seeds.length, Math.min(targetCount, MAX)). Asking for
    // four groups from five seeds is not a request the generator can honour, and
    // the screen silently corrects it rather than failing. Pinned because it is
    // arithmetic nobody would think to check, and because getting it wrong drops
    // a seed the user explicitly picked.
    const { user, onCreateExpressive } = setup()
    await chooseProject(user)
    await toExpressive(user)
    for (const name of ['Aronia', 'Cherry', 'Mango', 'Greengage', 'Elderberry']) {
      await user.click(await screen.findByRole('button', { name: new RegExp(name) }))
    }
    await user.type(screen.getByPlaceholderText('Palette name'), 'Set')
    await user.click(createButton())

    await waitFor(() => expect(onCreateExpressive).toHaveBeenCalled())
    expect(onCreateExpressive.mock.calls[0][2]).toBe(5)
  })

  it('keeps the two seed sets apart when the type is switched', async () => {
    // Tonal and expressive hold separate state, so flipping the control back
    // and forth must not silently drop what was picked on the other side.
    const { user } = setup()
    await chooseProject(user)
    await user.click(await screen.findByRole('button', { name: /Aronia/ }))
    await toExpressive(user)
    expect(seedButton('Aronia')).toHaveAttribute('aria-pressed', 'false')

    await user.click(seedButton('Cherry'))
    await user.click(screen.getByRole('tab', { name: 'Tonal System' }))
    expect(seedButton('Aronia')).toHaveAttribute('aria-pressed', 'true')
    expect(seedButton('Cherry')).toHaveAttribute('aria-pressed', 'false')
  })
})

describe('PaletteCreate · finishing', () => {
  it('joins the new palette to the project its seeds came from', async () => {
    const api = stubApi()
    const { user } = setup()
    await chooseProject(user)
    await user.type(screen.getByPlaceholderText('Palette name'), 'Brand')
    await user.click(await screen.findByRole('button', { name: /Aronia/ }))
    await user.click(createButton())

    await waitFor(() => expect(api.tag.assign).toHaveBeenCalledWith('palette', 99, 10))
  })

  it('leaves the screen open and shows why when creating fails', async () => {
    const { user, onCancel } = setup({
      onCreateTonal: vi.fn().mockRejectedValue(new Error('disk is full')),
    })
    await chooseProject(user)
    await user.type(screen.getByPlaceholderText('Palette name'), 'Brand')
    await user.click(await screen.findByRole('button', { name: /Aronia/ }))
    await user.click(createButton())

    expect(await screen.findByText('disk is full')).toBeInTheDocument()
    expect(onCancel).not.toHaveBeenCalled()
    // Re-enabled, so the failure is recoverable rather than terminal.
    expect(createButton()).toBeEnabled()
  })

  it('closes on cancel without creating anything', async () => {
    const { user, onCancel, onCreateTonal } = setup()
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onCancel).toHaveBeenCalled()
    expect(onCreateTonal).not.toHaveBeenCalled()
  })
})

describe('PaletteCreate · the search box', () => {
  it('filters by name prefix', async () => {
    const { user } = setup()
    await chooseProject(user)
    await user.type(await screen.findByPlaceholderText('Search colours…'), 'ch')
    expect(seedButton('Cherry')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Aronia/ })).toBeNull()
  })

  it('filters by hex with or without the hash', async () => {
    const { user } = setup()
    await chooseProject(user)
    const search = await screen.findByPlaceholderText('Search colours…')
    await user.type(search, '#d734')
    expect(seedButton('Cherry')).toBeInTheDocument()

    await user.clear(search)
    await user.type(search, 'd734')
    expect(seedButton('Cherry')).toBeInTheDocument()
  })

  it('says what matched nothing rather than showing an empty grid', async () => {
    const { user } = setup()
    await chooseProject(user)
    await user.type(await screen.findByPlaceholderText('Search colours…'), 'zzz')
    expect(screen.getByText(/No colours match/)).toBeInTheDocument()
  })
})

describe('PaletteCreate · accessibility', () => {
  it('gives every seed swatch a name a screen reader can use', async () => {
    // The swatches are colour with no text. Without a name each is announced as
    // "button", and a grid of them is unusable.
    const { user } = setup()
    await chooseProject(user)
    const grid = await screen.findAllByRole('button', { name: /·/ })
    expect(grid.length).toBe(COLOURS.length)
    expect(grid[0]).toHaveAccessibleName('Aronia · #7653ab')
  })

  it('labels the name field', async () => {
    // The visible "Name *" label is not associated with anything, so the only
    // accessible name this field has is its placeholder: which disappears the
    // moment someone types into it.
    setup()
    expect(screen.getByLabelText(/Name/)).toBe(screen.getByPlaceholderText('Palette name'))
  })

  it('has no axe violations on the tonal tab', async () => {
    const { user } = setup()
    await chooseProject(user)
    await screen.findByRole('button', { name: /Aronia/ })
    expect((await axe(document.body)).violations).toEqual([])
  })
})
