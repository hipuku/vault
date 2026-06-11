import React from 'react'
import styles from './SectionGrid.module.css'

interface SectionGridProps {
  children: React.ReactNode
  className?: string
}

export function SectionGrid({ children, className }: SectionGridProps): React.ReactElement {
  return (
    <div className={[styles.grid, className].filter(Boolean).join(' ')}>
      {children}
    </div>
  )
}
