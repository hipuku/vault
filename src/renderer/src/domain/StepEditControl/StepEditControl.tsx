import React, { useState, useRef, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSliders } from '@fortawesome/free-solid-svg-icons'
import { IconButton } from '../../atoms/IconButton/IconButton'
import { Select } from '../../primitives/Select/Select'
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
      <IconButton label="Edit step" size="sm" onClick={() => setOpen(o => !o)} aria-expanded={open}>
        <FontAwesomeIcon icon={faSliders} />
      </IconButton>
      {open && (
        <div className={styles.popover}>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Size</span>
            <span className={styles.unitField}>
              <input type="number" min={6} max={200} value={size} onChange={e => onChange(Number(e.target.value) || size, weight, lineHeight, letterSpacing)} className={styles.unitInput} />
              <span className={styles.unit}>px</span>
            </span>
          </label>
          <div className={styles.field}>
            <span className={styles.fieldLabel}>Weight</span>
            <span className={styles.controlBox}>
              <Select
                block
                ariaLabel="Weight"
                value={String(weight)}
                options={WEIGHTS.map(w => ({ key: String(w), label: String(w) }))}
                onChange={k => onChange(size, Number(k), lineHeight, letterSpacing)}
              />
            </span>
          </div>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Line height</span>
            <input value={lineHeight} onChange={e => onChange(size, weight, e.target.value, letterSpacing)} className={styles.control} />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Tracking</span>
            <input value={letterSpacing} onChange={e => onChange(size, weight, lineHeight, e.target.value)} className={styles.control} />
          </label>
        </div>
      )}
    </div>
  )
}
