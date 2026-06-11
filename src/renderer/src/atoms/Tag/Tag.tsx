import React from 'react'
import styles from './Tag.module.css'

interface TagProps {
  label: string
  colour: string
  active?: boolean
  onClick?: () => void
  onDelete?: () => void
  className?: string
}

export function Tag({
  label,
  colour,
  active = false,
  onClick,
  onDelete,
  className,
}: TagProps): React.ReactElement {
  return (
    <span
      className={[styles.tag, active ? styles.active : '', className].filter(Boolean).join(' ')}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    >
      <span className={styles.dot} style={{ background: colour }} />
      <span className={styles.label}>{label}</span>
      {onDelete && (
        <button
          className={styles.delete}
          aria-label={`Remove tag ${label}`}
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
        >
          ×
        </button>
      )}
    </span>
  )
}
