import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheck } from '@fortawesome/free-solid-svg-icons'
import styles from './MenuOption.module.css'

export interface MenuOptionProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  label: string
  /** Shows the tick on the right. */
  selected?: boolean
  /** Rendered before the label, typically a colour dot. */
  leading?: React.ReactNode
}

/**
 * A row in a Popover menu: optional leading mark, a label that truncates, and a tick
 * when selected.
 *
 * CommandPalette's rows deliberately do not use this. They are list items inside a
 * listbox driven by aria-activedescendant and arrow keys, not buttons, and that
 * component owns the only correct keyboard handling in the app.
 */
export function MenuOption({
  label,
  selected = false,
  leading,
  type = 'button',
  className,
  ...rest
}: MenuOptionProps): React.ReactElement {
  return (
    <button type={type} className={[styles.option, className].filter(Boolean).join(' ')} {...rest}>
      {leading}
      <span className={styles.label}>{label}</span>
      {selected && <FontAwesomeIcon icon={faCheck} className={styles.check} />}
    </button>
  )
}
