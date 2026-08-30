import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import styles from './Pill.module.css'

interface PillProps {
  label: string
  /** Optional leading icon. */
  icon?: IconDefinition
  className?: string
}

/** A small, neutral metadata pill, distinct from `Badge` (which carries
 *  status semantics). Use for descriptive tags like "Tonal · 5 ramps". */
export function Pill({ label, icon, className }: PillProps): React.ReactElement {
  return (
    <span className={[styles.pill, className].filter(Boolean).join(' ')}>
      {icon && <FontAwesomeIcon icon={icon} className={styles.icon} />}
      {label}
    </span>
  )
}
