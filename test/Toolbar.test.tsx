/**
 * Every page in the renderer gets its heading from here.
 *
 * vault#29 reported that none of the five pages had a heading of any level,
 * and the end-to-end suite worked around it by asserting on plain text. The
 * report was wrong, and wrong in a way worth recording: it counted `<h1>` in
 * the page files, and the pages do not contain one. They render `Toolbar`, and
 * `Toolbar` does. Counting a tag in a source file is not the same question as
 * asking the rendered document what its heading is, which is what a screen
 * reader asks.
 *
 * This asserts the rendered answer, so the next person gets it from a test
 * rather than from reading four files and inferring.
 */
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Toolbar } from '../src/renderer/src/molecules/Toolbar/Toolbar'

describe('Toolbar', () => {
  it('renders its title as the page heading', () => {
    render(<Toolbar title="Colors" actions={null} />)
    expect(screen.getByRole('heading', { level: 1, name: 'Colors' })).toBeTruthy()
  })

  it('names the heading from whatever the page passes', () => {
    // The five pages pass Colors, Fonts, Palettes, Type scales and a project
    // name, so the heading has to take its accessible name from the prop
    // rather than from anything fixed here.
    render(<Toolbar title="Type scales" actions={null} />)
    expect(screen.getByRole('heading', { level: 1, name: 'Type scales' })).toBeTruthy()
  })
})
