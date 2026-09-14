import React from 'react'

export type PopoverTriggerProps = React.ButtonHTMLAttributes<HTMLButtonElement>

/**
 * The pill-shaped button that opens a popover: Select, ColorFilters, UnitsControl
 * and FontPreviewControl all drew their own copy of it.
 *
 * The shape itself is the global `.pill`, shared with FavouriteToggle, which drew
 * the same rules again. Its hover and focus are the pill's too, which are the
 * secondary Button's: the two pills used to hover differently, side by side.
 *
 * It carries no popover state of its own: the caller owns `open` and passes the
 * aria-expanded / aria-haspopup that matches what it actually opens, which differs
 * between a listbox and a dialog.
 */
export function PopoverTrigger({ className, type = 'button', ...rest }: PopoverTriggerProps): React.ReactElement {
  return <button type={type} className={['pill', className].filter(Boolean).join(' ')} {...rest} />
}
