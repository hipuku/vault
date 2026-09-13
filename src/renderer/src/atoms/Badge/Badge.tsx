import React from 'react'
import styles from './Badge.module.css'

interface BadgeProps {
  label: string
  /** `muted` is the quiet one: a result that did not happen, where `neutral` is
   *  a result that simply has no tone. ContrastChip's failing AA and AAA are
   *  the first users. */
  variant?: 'success' | 'warning' | 'error' | 'neutral' | 'muted'
  className?: string
}

export function Badge({ label, variant = 'neutral', className }: BadgeProps): React.ReactElement {
  return <span className={[styles.badge, styles[variant], className].filter(Boolean).join(' ')}>{label}</span>
}
