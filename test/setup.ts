import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

/**
 * Shared setup for the jsdom project.
 *
 * jsdom implements no layout and so ships no scrollIntoView at all. Anything keeping
 * a highlighted row in view calls it, and without this the component throws in tests
 * over a method that cannot fail in a browser.
 */
Element.prototype.scrollIntoView = vi.fn()

afterEach(() => {
  // Testing Library does not unmount between tests on its own when globals are off,
  // and a left-behind tree makes getByRole ambiguous.
  cleanup()
  vi.clearAllMocks()
  vi.useRealTimers()
})
