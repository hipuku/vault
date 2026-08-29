import React from 'react'
import styles from './TriggerPill.module.css'

export interface TriggerPillProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Fill the available width, for a pill used as a form field. */
  block?: boolean
}

/**
 * The pill-shaped button that opens a popover — Select, ColorFilters, UnitsControl
 * and FontPreviewControl all drew their own copy of it.
 *
 * It carries no popover state of its own: the caller owns `open` and passes the
 * aria-expanded / aria-haspopup that matches what it actually opens, which differs
 * between a listbox and a dialog.
 */
export function TriggerPill({
  block = false,
  className,
  type = 'button',
  ...rest
}: TriggerPillProps): React.ReactElement {
  return (
    <button
      type={type}
      className={[styles.trigger, block ? styles.block : '', className].filter(Boolean).join(' ')}
      {...rest}
    />
  )
}
