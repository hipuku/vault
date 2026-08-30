import React from 'react'
import styles from './Panel.module.css'

interface PanelProps {
  /** Optional eyebrow header. */
  title?: string
  /** Optional controls aligned to the right of the header. */
  actions?: React.ReactNode
  className?: string
  children: React.ReactNode
}

/** A contained surface section: the standard grouping container for object pages. */
export function Panel({ title, actions, className, children }: PanelProps): React.ReactElement {
  return (
    <section className={[styles.panel, className].filter(Boolean).join(' ')}>
      {(title || actions) && (
        <div className={styles.header}>
          {title && <h3 className="eyebrow">{title}</h3>}
          {actions && <div className={styles.actions}>{actions}</div>}
        </div>
      )}
      {children}
    </section>
  )
}
