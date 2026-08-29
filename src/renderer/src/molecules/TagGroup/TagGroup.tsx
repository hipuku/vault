import React from 'react'
import styles from './TagGroup.module.css'

interface TagGroupProps {
  title: string
  count: number
  children: React.ReactNode
}

/** A labelled section in the aggregated tag view (one per asset type). */
export function TagGroup({ title, count, children }: TagGroupProps): React.ReactElement {
  return (
    <section className={styles.group}>
      <h2 className={styles.title}>
        {title}
        <span className={styles.count}>{count}</span>
      </h2>
      {children}
    </section>
  )
}
