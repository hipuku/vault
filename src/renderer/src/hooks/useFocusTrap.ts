import { useEffect, useRef } from 'react'

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), ' +
  'textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Keep Tab inside an overlay while it is open, and give focus back to whatever opened
 * it on close.
 *
 * Without this, Tab walks out of the overlay into the live page behind it, and closing
 * one drops focus to <body>: after deleting a colour you restarted from the top of the
 * sidebar. Modal owned this logic first; Drawer needs the same thing, so it lives here.
 *
 * `onEscape` is held in a ref, the way usePopover holds its `onClose`. Every caller
 * passes an inline arrow, so as a dependency it would tear the effect down and set it
 * up again on every render of the parent: the cleanup hands focus back to the opener
 * and the setup pulls it to the first field, so a click inside an open modal bounced
 * focus out of whatever the user was using. Found on 2026-09-01, when this repo
 * finally got a test that renders a component.
 *
 * @param open      whether the overlay is showing
 * @param container the element to trap within
 * @param onEscape  called on Escape, if the caller wants it handled here
 */
export function useFocusTrap(
  open: boolean,
  container: React.RefObject<HTMLElement | null>,
  onEscape?: () => void,
): void {
  const latestEscape = useRef(onEscape)
  latestEscape.current = onEscape

  useEffect(() => {
    if (!open) return
    const opener = document.activeElement as HTMLElement | null
    const node = container.current

    // The first field if there is one, otherwise the container, so the next Tab starts
    // inside rather than at the top of the page.
    const first = node?.querySelector<HTMLElement>(FOCUSABLE)
    ;(first ?? node)?.focus()

    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        latestEscape.current?.()
        return
      }
      if (e.key !== 'Tab' || !node) return
      const items = [...node.querySelectorAll<HTMLElement>(FOCUSABLE)]
      if (items.length === 0) {
        e.preventDefault()
        return
      }
      const edge = e.shiftKey ? items[0] : items[items.length - 1]
      if (document.activeElement === edge) {
        e.preventDefault()
        ;(e.shiftKey ? items[items.length - 1] : items[0]).focus()
      }
    }

    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      opener?.focus()
    }
  }, [open, container])
}
