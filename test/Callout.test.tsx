import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Callout } from '@renderer/molecules/Callout/Callout'
import { axe } from 'vitest-axe'

/**
 * The icon is decorative, so until 2026-09-13 an error callout and an info callout
 * were announced identically: role="note" and the same text, with nothing carrying
 * the tone.
 */
describe('Callout', () => {
  it('names its tone, so an error is not heard as a note', () => {
    const { rerender } = render(<Callout variant="error">Something went wrong.</Callout>)
    expect(screen.getByRole('note', { name: 'Error' })).toBeTruthy()

    rerender(<Callout variant="warning">Careful.</Callout>)
    expect(screen.getByRole('note', { name: 'Warning' })).toBeTruthy()

    rerender(<Callout>For your information.</Callout>)
    expect(screen.getByRole('note', { name: 'Note' })).toBeTruthy()
  })

  it('still renders its children', () => {
    render(
      <Callout variant="warning">
        Similar to <strong>Coral</strong> (#FF7F50)
      </Callout>,
    )
    expect(screen.getByText('Coral')).toBeTruthy()
  })

  it('has no axe violations', async () => {
    const { container } = render(<Callout variant="error">Something went wrong.</Callout>)
    expect((await axe(container)).violations).toEqual([])
  })
})
