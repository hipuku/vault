import { useEffect, useRef, useState } from 'react'

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
 */
/** `onClose` runs on both dismissal routes — outside click and Escape — for callers
 *  that need to reset something as the panel goes away (clear a query, blur a field). */
export function usePopover(onClose?: () => void): PopoverState {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent): void => {
      if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); onClose?.() }
    }
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') { setOpen(false); onClose?.() }
    }
    window.addEventListener('mousedown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  return { open, setOpen, toggle: () => setOpen(o => !o), close: () => setOpen(false), ref }
}
