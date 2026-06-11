import React, { useState, useRef, useEffect, useMemo } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronDown, faCheck, faPlus, faXmark } from '@fortawesome/free-solid-svg-icons'
import type { Tag } from '@shared/types'
import styles from './TagSelect.module.css'

interface TagSelectProps {
  allTags: Tag[]
  selectedIds: Set<number>
  onToggle: (tag: Tag) => void
  onCreateNew: () => void
}

/** Notion-style multiselect: a field of selected chips that opens a searchable
 *  dropdown of all tags, with a "create new tag" row at the bottom. */
export function TagSelect({ allTags, selectedIds, onToggle, onCreateNew }: TagSelectProps): React.ReactElement {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent): void { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    function onKey(e: KeyboardEvent): void { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('mousedown', onDown)
    window.addEventListener('keydown', onKey)
    return () => { window.removeEventListener('mousedown', onDown); window.removeEventListener('keydown', onKey) }
  }, [open])

  const selected = useMemo(() => allTags.filter(t => selectedIds.has(t.id)), [allTags, selectedIds])
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? allTags.filter(t => t.label.toLowerCase().includes(q)) : allTags
  }, [allTags, query])

  return (
    <div className={styles.root} ref={ref}>
      <button type="button" className={styles.field} onClick={() => setOpen(o => !o)}>
        {selected.length === 0 ? (
          <span className={styles.placeholder}>Add tags…</span>
        ) : (
          <span className={styles.chips}>
            {selected.map(t => (
              <span key={t.id} className={styles.chip}>
                <span className={styles.dot} style={{ background: t.colour }} />
                {t.label}
                <span
                  role="button"
                  tabIndex={-1}
                  className={styles.chipX}
                  aria-label={`Remove ${t.label}`}
                  onClick={e => { e.stopPropagation(); onToggle(t) }}
                >
                  <FontAwesomeIcon icon={faXmark} />
                </span>
              </span>
            ))}
          </span>
        )}
        <FontAwesomeIcon icon={faChevronDown} className={styles.caret} />
      </button>

      {open && (
        <div className={styles.panel}>
          <input
            autoFocus
            className={styles.search}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search tags…"
          />
          <div className={styles.list}>
            {filtered.map(t => (
              <button key={t.id} type="button" className={styles.option} onClick={() => onToggle(t)}>
                <span className={styles.dot} style={{ background: t.colour }} />
                <span className={styles.optionLabel}>{t.label}</span>
                {selectedIds.has(t.id) && <FontAwesomeIcon icon={faCheck} className={styles.optionCheck} />}
              </button>
            ))}
            {filtered.length === 0 && <p className={styles.noMatch}>No tags match.</p>}
          </div>
          <button type="button" className={styles.create} onClick={() => { setOpen(false); onCreateNew() }}>
            <FontAwesomeIcon icon={faPlus} className={styles.createIcon} />
            Create new tag
          </button>
        </div>
      )}
    </div>
  )
}
