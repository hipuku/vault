import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFilter } from '@fortawesome/free-solid-svg-icons'
import { SORT_OPTIONS, GROUP_OPTIONS, type SortKey, type GroupKey } from '../../lib/colourSort'
import { usePopover } from '../../hooks/usePopover'
import { Popover } from '../../atoms/Popover/Popover'
import { TriggerPill } from '../../atoms/TriggerPill/TriggerPill'
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
  const { open, toggle, ref } = usePopover()

  return (
    <div className={styles.root} ref={ref}>
      <TriggerPill
        
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={toggle}
      >
        <FontAwesomeIcon icon={faFilter} className={styles.triggerIcon} />
        Filters
      </TriggerPill>

      {open && (
        <Popover align="right" width="sm" pad="roomy" role="dialog" ariaLabel="Filters">
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
        </Popover>
      )}
    </div>
  )
}
