import React, { useState, useRef, useEffect } from 'react'
import styles from './FontPreviewControl.module.css'

interface FontPreviewControlProps {
  text: string
  size: number
  onTextChange: (text: string) => void
  onSizeChange: (size: number) => void
}

/** Compact toolbar control for preview text + size — opens a popover. Mirrors the
 *  ColorFilters idiom so the Fonts toolbar matches the other pages. The single
 *  source of truth for how font cards and the drawer specimens render. */
export function FontPreviewControl({ text, size, onTextChange, onSizeChange }: FontPreviewControlProps): React.ReactElement {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent): void {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent): void { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('mousedown', onDown)
    window.addEventListener('keydown', onKey)
    return () => { window.removeEventListener('mousedown', onDown); window.removeEventListener('keydown', onKey) }
  }, [open])

  return (
    <div className={styles.root} ref={ref}>
      <button
        type="button"
        className={styles.trigger}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
      >
        <span className={styles.aa}>Aa</span>
        <span className={styles.size}>{size}px</span>
      </button>

      {open && (
        <div className={styles.panel} role="dialog" aria-label="Preview text and size">
          <input
            className={styles.textInput}
            value={text}
            onChange={e => onTextChange(e.target.value)}
            placeholder="Preview text…"
            aria-label="Preview text"
            autoFocus
          />
          <div className={styles.sizeRow}>
            <span className={styles.sizeLabel}>Size</span>
            <input
              type="range"
              min={12}
              max={72}
              value={size}
              onChange={e => onSizeChange(Number(e.target.value))}
              className={styles.slider}
              aria-label="Preview size"
            />
            <span className={styles.sizeVal}>{size}px</span>
          </div>
        </div>
      )}
    </div>
  )
}
