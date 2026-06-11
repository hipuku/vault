import React from 'react'
import styles from './Spinner.module.css'

interface SpinnerProps {
  size?: 'sm' | 'md'
  className?: string
}

export function Spinner({ size = 'md', className }: SpinnerProps): React.ReactElement {
  return (
    <span
      className={[styles.spinner, styles[size], className].filter(Boolean).join(' ')}
      role="status"
      aria-label="Loading"
    />
  )
}
