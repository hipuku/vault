import React, { useState, useRef, useMemo } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheck, faPlus, faXmark } from '@fortawesome/free-solid-svg-icons'
import type { Tag } from '@shared/types'
import { usePopover } from '../../hooks/usePopover'
import { Popover } from '../../primitives/Popover/Popover'
import styles from './TagSelect.module.css'

interface TagSelectProps {
  allTags: Tag[]
  selectedIds: Set<number>
  onToggle: (tag: Tag) => void
  /** Open the create flow, prefilled with the typed query as the label. */
  onCreateNew: (label: string) => void
  /** Single-select mode: picking one replaces the current selection and closes. */
  single?: boolean
  placeholder?: string
}

/** Notion-style combobox: type to prefix-filter, pick from the dropdown, or
 *  create a new entry (prefilled with the query) from the row at the bottom. */
export function TagSelect({ allTags, selectedIds, onToggle, onCreateNew, single = false, placeholder }: TagSelectProps): React.ReactElement {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const { open, setOpen, ref } = usePopover(() => {
    setQuery('')
    inputRef.current?.blur()
  })

  const selected = useMemo(() => allTags.filter(t => selectedIds.has(t.id)), [allTags, selectedIds])
  const q = query.trim().toLowerCase()
  const filtered = useMemo(
    () => (q ? allTags.filter(t => t.label.toLowerCase().startsWith(q)) : allTags),
    [allTags, q]
  )
  const exactMatch = q !== '' && allTags.some(t => t.label.toLowerCase() === q)

  function pick(tag: Tag): void {
    onToggle(tag)
    setQuery('')
    if (single) { setOpen(false) } else { inputRef.current?.focus() }
  }

  function create(): void {
    onCreateNew(query.trim())
    setOpen(false)
    setQuery('')
  }

  return (
    <div className={styles.root} ref={ref}>
      <div className={styles.field} onMouseDown={() => { setOpen(true); inputRef.current?.focus() }}>
        {selected.map(t => (
          <span key={t.id} className={styles.chip}>
            <span className={styles.dot} style={{ background: t.colour }} />
            {t.label}
            <span
              role="button"
              tabIndex={-1}
              className={styles.chipX}
              aria-label={`Remove ${t.label}`}
              onMouseDown={e => { e.preventDefault(); e.stopPropagation(); onToggle(t) }}
            >
              <FontAwesomeIcon icon={faXmark} />
            </span>
          </span>
        ))}
        <input
          ref={inputRef}
          className={styles.input}
          value={query}
          placeholder={selected.length === 0 ? (placeholder ?? 'Add to projects…') : ''}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault()
              if (q === '') return                          // empty query: no-op
              if (filtered.length === 0) { create(); return } // nothing matches: create it
              const firstUnselected = filtered.find(t => !selectedIds.has(t.id))
              if (firstUnselected) pick(firstUnselected)     // add the first addable match
              else setQuery('')                              // all matches already added: clear, don't toggle off
            } else if (e.key === 'Backspace' && query === '' && selected.length > 0) {
              onToggle(selected[selected.length - 1])
            }
          }}
        />
      </div>

      {open && (
        <Popover align="stretch" pad="tight">
          <div className={styles.list}>
            {filtered.map(t => (
              <button key={t.id} type="button" className={styles.option} onMouseDown={e => { e.preventDefault(); pick(t) }}>
                <span className={styles.dot} style={{ background: t.colour }} />
                <span className={styles.optionLabel}>{t.label}</span>
                {selectedIds.has(t.id) && <FontAwesomeIcon icon={faCheck} className={styles.optionCheck} />}
              </button>
            ))}
            {filtered.length === 0 && (
              <p className={styles.noMatch}>No projects{q ? ` starting with “${query.trim()}”` : ''}.</p>
            )}
          </div>
          <button type="button" className={styles.create} onMouseDown={e => { e.preventDefault(); create() }}>
            <FontAwesomeIcon icon={faPlus} className={styles.createIcon} />
            {q && !exactMatch ? `Create “${query.trim()}”` : 'Create new project'}
          </button>
        </Popover>
      )}
    </div>
  )
}
