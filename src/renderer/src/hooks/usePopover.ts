import { useCallback, useEffect, useRef, useState } from 'react'

export interface PopoverState {
  open: boolean
  setOpen: (open: boolean) => void
  toggle: () => void
  close: () => void
  /** Put this on the positioned wrapper holding both trigger and panel. */
  ref: React.RefObject<HTMLDivElement | null>
}

/**
 * Open state for a popover, plus the two ways every one of them closes: a mousedown
 * outside the wrapper, and Escape. Six components had their own copy of this effect.
 *
 * `onClose` runs on both dismissal routes, for callers that reset something as the
 * panel goes away: TagSelect clears its query and blurs its input. It is held in a
 * ref so an inline arrow from the caller does not re-subscribe the listeners on every
 * render, and `toggle`/`close` are stable so they can be effect dependencies.
 */
export function usePopover(onClose?: () => void): PopoverState {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  const close = useCallback(() => {
    setOpen(false)
    onCloseRef.current?.()
  }, [])
  const toggle = useCallback(() => setOpen(o => !o), [])

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent): void => {
      if (ref.current && !ref.current.contains(e.target as Node)) close()
    }
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('mousedown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [open, close])

  return { open, setOpen, toggle, close, ref }
}
