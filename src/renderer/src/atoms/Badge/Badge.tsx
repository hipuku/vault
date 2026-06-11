import React from 'react'
import styles from './Badge.module.css'

interface BadgeProps {
  label: string
  variant?: 'success' | 'error' | 'neutral'
  className?: string
}

export function Badge({
  label,
  variant = 'neutral',
  className,
}: BadgeProps): React.ReactElement {
  return (
    <span
      className={[styles.badge, styles[variant], className].filter(Boolean).join(' ')}
    >
      {label}
    </span>
  )
}
