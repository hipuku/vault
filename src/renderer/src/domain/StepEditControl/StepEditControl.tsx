import React, { useState, useRef, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSliders } from '@fortawesome/free-solid-svg-icons'
import styles from './StepEditControl.module.css'

interface StepEditControlProps {
  size: number
  weight: number
  lineHeight: string
  letterSpacing: string
  onChange: (size: number, weight: number, lineHeight: string, letterSpacing: string) => void
}

const WEIGHTS = [100, 200, 300, 400, 500, 600, 700, 800, 900]

export function StepEditControl({ size, weight, lineHeight, letterSpacing, onChange }: StepEditControlProps): React.ReactElement {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent): void { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    function onKey(e: KeyboardEvent): void { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('mousedown', onDown)
    window.addEventListener('keydown', onKey)
    return () => { window.removeEventListener('mousedown', onDown); window.removeEventListener('keydown', onKey) }
  }, [open])

  return (
    <div className={styles.root} ref={ref}>
      <button type="button" className={styles.trigger} onClick={() => setOpen(o => !o)} aria-label="Edit step">
        <FontAwesomeIcon icon={faSliders} />
      </button>
      {open && (
        <div className={styles.popover}>
          <label className={styles.field}>
            <span>Size</span>
            <div className={styles.inputUnit}>
              <input type="number" min={6} max={200} value={size} onChange={e => onChange(Number(e.target.value) || size, weight, lineHeight, letterSpacing)} className={styles.input} />
              <span className={styles.unit}>px</span>
            </div>
          </label>
          <label className={styles.field}>
            <span>Weight</span>
            <select value={weight} onChange={e => onChange(size, Number(e.target.value), lineHeight, letterSpacing)} className={styles.input}>
              {WEIGHTS.map(w => <option key={w} value={w}>{w}</option>)}
            </select>
          </label>
          <label className={styles.field}>
            <span>Line height</span>
            <input value={lineHeight} onChange={e => onChange(size, weight, e.target.value, letterSpacing)} className={styles.input} />
          </label>
          <label className={styles.field}>
            <span>Tracking</span>
            <input value={letterSpacing} onChange={e => onChange(size, weight, lineHeight, e.target.value)} className={styles.input} />
          </label>
        </div>
      )}
    </div>
  )
}
