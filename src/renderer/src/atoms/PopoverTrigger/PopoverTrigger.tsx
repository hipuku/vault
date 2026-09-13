import React from 'react'
import styles from './PopoverTrigger.module.css'

export type PopoverTriggerProps = React.ButtonHTMLAttributes<HTMLButtonElement>

/**
 * The pill-shaped button that opens a popover: Select, ColorFilters, UnitsControl
 * and FontPreviewControl all drew their own copy of it.
 *
 * The shape itself is the global `.pill`, shared with FavouriteToggle, which drew
 * the same rules again. This component owns its hover, which darkens the border
 * where the toggle tints its ground.
 *
 * It carries no popover state of its own: the caller owns `open` and passes the
 * aria-expanded / aria-haspopup that matches what it actually opens, which differs
 * between a listbox and a dialog.
 */
export function PopoverTrigger({ className, type = 'button', ...rest }: PopoverTriggerProps): React.ReactElement {
  return <button type={type} className={['pill', styles.trigger, className].filter(Boolean).join(' ')} {...rest} />
}
