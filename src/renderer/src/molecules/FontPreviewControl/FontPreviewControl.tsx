import React from 'react'
import { usePopover } from '../../hooks/usePopover'
import { Popover } from '../../atoms/Popover/Popover'
import { TriggerPill } from '../../atoms/TriggerPill/TriggerPill'
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
  const { open, toggle, ref } = usePopover()

  return (
    <div className={styles.root} ref={ref}>
      <TriggerPill
        
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={toggle}
      >
        <span className={styles.aa}>Aa</span>
        <span className={styles.size}>{size}px</span>
      </TriggerPill>

      {open && (
        <Popover align="right" width="lg" column role="dialog" ariaLabel="Preview settings">
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
        </Popover>
      )}
    </div>
  )
}
