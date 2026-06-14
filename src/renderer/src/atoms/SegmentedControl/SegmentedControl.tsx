import React from 'react'
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

/** The standard pill-tab / segmented control: one active segment tinted with the
 *  primary surface, the rest muted. Replaces the hand-rolled tab rows. */
export function SegmentedControl<T extends string>({
  options, value, onChange, size = 'md', ariaLabel, className,
}: SegmentedControlProps<T>): React.ReactElement {
  return (
    <div className={[styles.root, className].filter(Boolean).join(' ')} role="tablist" aria-label={ariaLabel}>
      {options.map(o => (
        <button
          key={o.id}
          type="button"
          role="tab"
          aria-selected={value === o.id}
          className={[styles.seg, size === 'sm' ? styles.sm : '', value === o.id ? styles.segOn : ''].filter(Boolean).join(' ')}
          onClick={() => onChange(o.id)}
        >
          {o.icon && <FontAwesomeIcon icon={o.icon} />}
          {o.label}
        </button>
      ))}
    </div>
  )
}
