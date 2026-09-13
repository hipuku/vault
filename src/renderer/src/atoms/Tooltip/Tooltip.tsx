import React, { useState, useId, useRef, useLayoutEffect, useCallback, useEffect } from 'react'
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

const GAP = 8 // matches --haus-space-2

/** A small accessible tooltip. The bubble is rendered in a portal on `document.body`
 *  and positioned from the trigger's bounding rect, so it never gets clipped by an
 *  ancestor's `overflow` (scroll containers, modals, cards).
 *
 *  WCAG 1.4.13 asks for two things this did not do (vault#46). **Dismissible**: Escape
 *  closes it without moving the pointer or focus, which matters when the bubble covers
 *  what is under it. **Hoverable**: the pointer can move onto the bubble and read it,
 *  which matters at magnification, so the bubble takes pointer events and the pair
 *  closes on leaving both with a short grace period. */
export function Tooltip({ label, children, side = 'top', align = 'center' }: TooltipProps): React.ReactElement {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const ref = useRef<HTMLSpanElement>(null)
  const id = useId()
  // One timer for the grace period between leaving the trigger and entering the
  // bubble: without it the gap between them closes the tooltip on the way over.
  const closing = useRef<ReturnType<typeof setTimeout> | null>(null)

  const cancelClose = useCallback((): void => {
    if (closing.current) {
      clearTimeout(closing.current)
      closing.current = null
    }
  }, [])

  const show = useCallback((): void => {
    cancelClose()
    setOpen(true)
  }, [cancelClose])

  /** Leaving either the trigger or the bubble starts the close; entering the other
   *  cancels it. */
  const startClose = useCallback((): void => {
    cancelClose()
    closing.current = setTimeout(() => setOpen(false), 120)
  }, [cancelClose])

  const closeNow = useCallback((): void => {
    cancelClose()
    setOpen(false)
  }, [cancelClose])

  useEffect(() => cancelClose, [cancelClose])

  // Dismissible: Escape hides the bubble and leaves focus where it is.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        closeNow()
      }
    }
    document.addEventListener('keydown', onKey, true)
    return () => document.removeEventListener('keydown', onKey, true)
  }, [open, closeNow])

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
      onMouseEnter={show}
      onMouseLeave={startClose}
      onFocusCapture={show}
      onBlurCapture={closeNow}
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
            onMouseEnter={show}
            onMouseLeave={startClose}
          >
            {label}
          </span>,
          document.body,
        )}
    </span>
  )
}
