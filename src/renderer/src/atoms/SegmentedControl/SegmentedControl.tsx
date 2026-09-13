import React, { useRef } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import styles from './SegmentedControl.module.css'

export interface SegmentedOption<T extends string> {
  id: T
  label: string
  icon?: IconDefinition
}

interface SegmentedControlProps<T extends string> {
  options: Array<SegmentedOption<T>>
  value: T
  onChange: (id: T) => void
  size?: 'sm' | 'md'
  ariaLabel?: string
  className?: string
}

/** The standard segmented control: one chosen segment tinted with the primary
 *  surface, the rest muted.
 *
 *  **A radio group, not a tablist** (vault#46's sibling, vault#45). It rendered
 *  role="tablist" with role="tab" segments, which promises tabpanels, aria-controls
 *  and arrow-key movement, and delivered none of them: every segment was its own Tab
 *  stop and a screen reader announced "tab, 1 of 4" with no panel to go to. Every use
 *  is a single choice from a set, so it is a radio group: one Tab stop, arrows to
 *  move, and the choice follows the focus as radios do. A call site that really wants
 *  tabs wants panels too, and haus has a Tabs component for that. */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  size = 'md',
  ariaLabel,
  className,
}: SegmentedControlProps<T>): React.ReactElement {
  const refs = useRef<Array<HTMLButtonElement | null>>([])
  const index = options.findIndex(o => o.id === value)

  /** Arrows move and choose, which is how a radio group behaves: there is no
   *  separate commit step, so focus and selection never disagree. */
  function onKeyDown(e: React.KeyboardEvent<HTMLButtonElement>): void {
    const last = options.length - 1
    let next: number | null = null
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = index >= last ? 0 : index + 1
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = index <= 0 ? last : index - 1
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = last
    if (next === null) return
    e.preventDefault()
    onChange(options[next].id)
    refs.current[next]?.focus()
  }

  return (
    <div className={[styles.root, className].filter(Boolean).join(' ')} role="radiogroup" aria-label={ariaLabel}>
      {options.map((o, i) => {
        const chosen = value === o.id
        return (
          <button
            key={o.id}
            ref={el => {
              refs.current[i] = el
            }}
            type="button"
            role="radio"
            aria-checked={chosen}
            // One Tab stop for the group: Tab reaches the chosen segment, arrows
            // move within it. Nothing chosen yet puts the stop on the first.
            tabIndex={chosen || (index === -1 && i === 0) ? 0 : -1}
            className={[styles.seg, size === 'sm' ? styles.sm : '', chosen ? styles.segOn : '']
              .filter(Boolean)
              .join(' ')}
            onClick={() => onChange(o.id)}
            onKeyDown={onKeyDown}
          >
            {o.icon && <FontAwesomeIcon icon={o.icon} />}
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
