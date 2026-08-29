import React from 'react'
import styles from './Popover.module.css'

export interface PopoverProps {
  /** Which edge to pin to. 'stretch' matches the trigger's width, for menus. */
  align?: 'left' | 'right' | 'stretch'
  width?: 'sm' | 'md' | 'lg' | 'auto'
  pad?: 'tight' | 'default' | 'roomy'
  /** Stack children in a column with the standard gap. */
  column?: boolean
  id?: string
  role?: string
  ariaLabel?: string
  children: React.ReactNode
}

/**
 * The floating panel half of a popover. Open state, the trigger and outside-click
 * dismissal live in `usePopover` — this is only the surface, so a caller can put it
 * behind whatever trigger it already has.
 */
export function Popover({
  align = 'left',
  width = 'auto',
  pad = 'default',
  column = false,
  id,
  role,
  ariaLabel,
  children,
}: PopoverProps): React.ReactElement {
  return (
    <div
      id={id}
      role={role}
      aria-label={ariaLabel}
      className={[
        styles.panel,
        styles[align],
        width === 'auto' ? '' : styles[width],
        styles[pad],
        column ? styles.column : '',
      ].filter(Boolean).join(' ')}
    >
      {children}
    </div>
  )
}
