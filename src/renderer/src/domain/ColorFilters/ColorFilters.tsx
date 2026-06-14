import React, { useState, useRef, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFilter } from '@fortawesome/free-solid-svg-icons'
import { SORT_OPTIONS, GROUP_OPTIONS, type SortKey, type GroupKey } from '../../lib/colourSort'
import styles from './ColorFilters.module.css'

interface ColorFiltersProps {
  sortKey: SortKey
  onSortChange: (key: SortKey) => void
  groupKey: GroupKey
  onGroupChange: (key: GroupKey) => void
}

/** Unified sort / group popover for the Colors page. Closes on
 *  outside-click and Escape — mirrors the Menu primitive. */
export function ColorFilters({
  sortKey,
  onSortChange,
  groupKey,
  onGroupChange,
}: ColorFiltersProps): React.ReactElement {
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
        <FontAwesomeIcon icon={faFilter} className={styles.triggerIcon} />
        Filters
      </button>

      {open && (
        <div className={styles.panel} role="dialog" aria-label="Sort and group colours">
          <fieldset className={styles.section}>
            <legend className={styles.legend}>Sort</legend>
            {SORT_OPTIONS.map(o => (
              <label key={o.key} className={styles.radio}>
                <input
                  type="radio"
                  name="colour-sort"
                  checked={sortKey === o.key}
                  onChange={() => onSortChange(o.key)}
                />
                {o.label}
              </label>
            ))}
          </fieldset>

          <fieldset className={styles.section}>
            <legend className={styles.legend}>Group by</legend>
            {GROUP_OPTIONS.map(o => (
              <label key={o.key} className={styles.radio}>
                <input
                  type="radio"
                  name="colour-group"
                  checked={groupKey === o.key}
                  onChange={() => onGroupChange(o.key)}
                />
                {o.label}
              </label>
            ))}
          </fieldset>
        </div>
      )}
    </div>
  )
}
