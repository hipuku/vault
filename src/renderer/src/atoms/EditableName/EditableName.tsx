import React, { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPen } from '@fortawesome/free-solid-svg-icons'
import styles from './EditableName.module.css'

interface EditableNameProps {
  value: string
  onCommit: (next: string) => void
  ariaLabel: string
  /** Applied to both the display span and the edit input so the type matches the
   *  surrounding context (toolbar title, drawer head, …). The span otherwise
   *  inherits its parent's font. */
  textClassName?: string
}

/** Click-to-edit name with a hover pen — the shared rename affordance. */
export function EditableName({ value, onCommit, ariaLabel, textClassName }: EditableNameProps): React.ReactElement {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  useEffect(() => { setDraft(value); setEditing(false) }, [value])

  function commit(): void {
    setEditing(false)
    const next = draft.trim()
    if (next && next !== value) onCommit(next)
    else setDraft(value)
  }

  const fieldCls = [styles.field, textClassName].filter(Boolean).join(' ')

  return (
    <span className={styles.root}>
      {editing ? (
        <input
          autoFocus
          className={fieldCls}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={commit}
          onFocus={e => e.target.select()}
          onKeyDown={e => {
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
            if (e.key === 'Escape') { setDraft(value); setEditing(false) }
          }}
          aria-label={ariaLabel}
        />
      ) : (
        <>
          <span className={fieldCls} title={value}>{value}</span>
          <button type="button" className={['icon-btn', 'icon-btn--xs', styles.pen].join(' ')} onClick={() => setEditing(true)} aria-label={`Rename ${ariaLabel}`}>
            <FontAwesomeIcon icon={faPen} />
          </button>
        </>
      )}
    </span>
  )
}
