import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import styles from './Chip.module.css'

interface ChipProps {
  label: string
  /** Optional leading icon. */
  icon?: IconDefinition
  className?: string
}

/** A small, neutral metadata pill, distinct from `Badge` (which carries
 *  status semantics). Use for descriptive tags like "Tonal · 5 ramps". */
export function Chip({ label, icon, className }: ChipProps): React.ReactElement {
  return (
    <span className={[styles.chip, className].filter(Boolean).join(' ')}>
      {icon && <FontAwesomeIcon icon={icon} className={styles.icon} />}
      {label}
    </span>
  )
}
