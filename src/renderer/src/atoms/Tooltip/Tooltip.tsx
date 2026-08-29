import React, { useState, useId, useRef, useLayoutEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import styles from './Tooltip.module.css'

interface TooltipProps {
  /** The bubble text. */
  label: string
  /** The trigger element (must accept aria-describedby for a11y). */
  children: React.ReactElement<{ 'aria-describedby'?: string }>
  side?: 'top' | 'bottom'
  align?: 'center' | 'start' | 'end'
}

const GAP = 8 // matches --space-2

/** A small accessible tooltip. The bubble is rendered in a portal on `document.body`
 *  and positioned from the trigger's bounding rect, so it never gets clipped by an
 *  ancestor's `overflow` (scroll containers, modals, cards). */
export function Tooltip({ label, children, side = 'top', align = 'center' }: TooltipProps): React.ReactElement {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const ref = useRef<HTMLSpanElement>(null)
  const id = useId()

  const measure = useCallback(() => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const top = side === 'top' ? r.top - GAP : r.bottom + GAP
    const left = align === 'center' ? r.left + r.width / 2 : align === 'start' ? r.left : r.right
    setPos({ top, left })
  }, [side, align])

  useLayoutEffect(() => {
    if (!open) return
    measure()
    window.addEventListener('scroll', measure, true)
    window.addEventListener('resize', measure)
    return () => {
      window.removeEventListener('scroll', measure, true)
      window.removeEventListener('resize', measure)
    }
  }, [open, measure])

  // Translate the bubble onto the anchor point: Y flips for top, X depends on align.
  const tx = align === 'center' ? '-50%' : align === 'end' ? '-100%' : '0'
  const ty = side === 'top' ? '-100%' : '0'

  return (
    <span
      ref={ref}
      className={styles.root}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocusCapture={() => setOpen(true)}
      onBlurCapture={() => setOpen(false)}
    >
      {React.cloneElement(children, { 'aria-describedby': open ? id : undefined })}
      {open &&
        pos &&
        createPortal(
          <span
            role="tooltip"
            id={id}
            className={styles.bubble}
            style={{ top: pos.top, left: pos.left, transform: `translate(${tx}, ${ty})` }}
          >
            {label}
          </span>,
          document.body,
        )}
    </span>
  )
}
