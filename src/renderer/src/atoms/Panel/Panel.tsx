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

/** A contained surface section: the standard grouping container for object pages.
 *
 *  The title is an h2 because a panel is a section of a page, directly under the
 *  page's h1 in Toolbar. It was an h3, so TypeScaleView's Specimen panel skipped a
 *  level and a screen reader's heading list jumped from the page to a third tier. */
export function Panel({ title, actions, className, children }: PanelProps): React.ReactElement {
  return (
    <section className={[styles.panel, className].filter(Boolean).join(' ')}>
      {(title || actions) && (
        <div className={styles.header}>
          {title && <h2 className="eyebrow">{title}</h2>}
          {actions && <div className={styles.actions}>{actions}</div>}
        </div>
      )}
      {children}
    </section>
  )
}
