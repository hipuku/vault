import React from 'react'
import styles from './Toolbar.module.css'

interface ToolbarProps {
  title: React.ReactNode
  actions?: React.ReactNode
  children?: React.ReactNode
}

export function Toolbar({ title, actions, children }: ToolbarProps): React.ReactElement {
  return (
    <div className={styles.toolbar}>
      <div className={styles.row}>
        <h1 className={styles.title}>{title}</h1>
        {actions && <div className={styles.actions}>{actions}</div>}
      </div>
      {children && <div className={styles.extras}>{children}</div>}
    </div>
  )
}
