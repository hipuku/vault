import React, { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronDown } from '@fortawesome/free-solid-svg-icons'
import type { Swatch } from '@shared/types'
import { Menu } from '../../primitives/Menu/Menu'
import { toRgbString, toHslString } from '../../lib/colour'
import styles from './SwatchItem.module.css'

interface SwatchItemProps {
  swatch: Swatch
  index: number
  varName: string
  onLabelChange: (swatchId: number, label: string) => void
}

export function SwatchItem({ swatch, index, varName, onLabelChange }: SwatchItemProps): React.ReactElement {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(swatch.label)
  const placeholder = `${(index + 1) * 100}`

  function commit(): void {
    if (draft.trim() !== swatch.label) onLabelChange(swatch.id, draft.trim())
    setEditing(false)
  }

  function copy(value: string): void {
    window.api.clipboard.write(value)
  }

  return (
    <div className={styles.item}>
      <div className={styles.block} style={{ background: swatch.hex }} />
      {editing ? (
        <input
          autoFocus
          className={styles.labelInput}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setDraft(swatch.label); setEditing(false) } }}
        />
      ) : (
        <button type="button" className={styles.label} onClick={() => { setDraft(swatch.label); setEditing(true) }} title="Click to rename">
          {swatch.label.trim() || placeholder}
        </button>
      )}
      <span className={styles.hex}>{swatch.hex}</span>
      <Menu
        align="left"
        triggerLabel="Copy formats"
        trigger={<span className={styles.copyTrigger}>Copy <FontAwesomeIcon icon={faChevronDown} className={styles.chev} /></span>}
        items={[
          { label: `Hex · ${swatch.hex}`, onClick: () => copy(swatch.hex) },
          { label: `RGB`, onClick: () => copy(toRgbString(swatch.hex)) },
          { label: `HSL`, onClick: () => copy(toHslString(swatch.hex)) },
          { label: `CSS var`, onClick: () => copy(`${varName}: ${swatch.hex};`) },
        ]}
      />
    </div>
  )
}
