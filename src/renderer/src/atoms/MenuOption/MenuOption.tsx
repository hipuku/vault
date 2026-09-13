import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheck } from '@fortawesome/free-solid-svg-icons'
import styles from './MenuOption.module.css'

interface Common {
  label: string
  /** Shows the tick on the right. */
  selected?: boolean
  /** Rendered before the label, typically a colour dot. */
  leading?: React.ReactNode
  /** Highlighted by the keyboard, for the `li` form. Not DOM focus. */
  active?: boolean
  className?: string
}

export type MenuOptionProps =
  | (Common & { as?: 'button' } & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'>)
  | (Common & { as: 'li' } & Omit<React.LiHTMLAttributes<HTMLLIElement>, 'children'>)

/**
 * A row in a Popover menu: optional leading mark, a label that truncates, and a tick
 * when selected.
 *
 * Two forms, because a menu row and a listbox option are not the same element. A
 * menu row is a button and takes focus. A listbox option cannot be: `role="option"`
 * has to be a direct child of the listbox, so Select renders `as="li"`, keeps focus
 * on its trigger, and marks the current row with `active` while
 * `aria-activedescendant` announces it.
 *
 * CommandPalette's rows still do not use this. They carry an icon, a hint and their
 * own filtering, and it owns the palette's layout rather than this menu's.
 *
 * **The tick and the accessibility tree stay in sync by construction** (vault#44).
 * The button form is a toggle, so `selected` sets `aria-pressed` unless the caller
 * has given the row a role or a pressed state of its own. ProjectPicker's rows drew
 * the tick and announced nothing, so a screen reader heard "Brand refresh, button"
 * whether or not the project was on the item. The `li` form is unaffected: Select
 * passes `role="option"` and `aria-selected`, which is that pattern's equivalent.
 */
export function MenuOption(props: MenuOptionProps): React.ReactElement {
  const { label, selected = false, leading, active = false, className } = props
  const body = (
    <>
      {leading}
      <span className={styles.label}>{label}</span>
      {selected && <FontAwesomeIcon icon={faCheck} className={styles.check} />}
    </>
  )
  const classes = [styles.option, active ? styles.active : '', className].filter(Boolean).join(' ')

  if (props.as === 'li') {
    const { as: _as, label: _l, selected: _s, leading: _lead, active: _a, className: _c, ...rest } = props
    return (
      <li className={classes} {...rest}>
        {body}
      </li>
    )
  }

  const {
    as: _as,
    label: _l,
    selected: _s,
    leading: _lead,
    active: _a,
    className: _c,
    type = 'button',
    ...rest
  } = props
  // A row that draws a tick is a toggle. Only default it: a caller that has given
  // the row another role, or its own pressed state, means it.
  const pressed = rest.role === undefined && rest['aria-pressed'] === undefined ? selected : rest['aria-pressed']
  return (
    <button type={type} aria-pressed={pressed} className={classes} {...rest}>
      {body}
    </button>
  )
}
