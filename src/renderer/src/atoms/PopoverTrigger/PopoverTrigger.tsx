import React from 'react'
import styles from './PopoverTrigger.module.css'

export type PopoverTriggerProps = React.ButtonHTMLAttributes<HTMLButtonElement>

/**
 * The pill-shaped button that opens a popover: Select, ColorFilters, UnitsControl
 * and FontPreviewControl all drew their own copy of it.
 *
 * It carries no popover state of its own: the caller owns `open` and passes the
 * aria-expanded / aria-haspopup that matches what it actually opens, which differs
 * between a listbox and a dialog.
 */
export function PopoverTrigger({ className, type = 'button', ...rest }: PopoverTriggerProps): React.ReactElement {
  return <button type={type} className={[styles.trigger, className].filter(Boolean).join(' ')} {...rest} />
}
