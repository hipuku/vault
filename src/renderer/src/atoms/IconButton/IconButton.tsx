import React from 'react'

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
  size?: 'xs' | 'sm' | 'md'
  tone?: 'neutral' | 'primary' | 'danger'
  /** Marks a toggle as on. Emits aria-pressed and holds the on-state colour
   *  through hover. */
  pressed?: boolean
}

/** The canonical icon-only button. Renders the locked `.icon-btn` pattern from
 *  global.css (transparent → circular tinted bg + colour shift on hover).
 *
 *  `pressed` is a state, not a tone: the favourite star in ColorDrawer and
 *  FontDrawer is on or off, and a toggle that only swaps its aria-label reads to
 *  a screen reader as two different buttons rather than one control with a
 *  state. Kept out of `tone` deliberately — that union is ruled to
 *  neutral / primary / danger. */
export function IconButton({
  label,
  size = 'md',
  tone = 'neutral',
  pressed,
  className,
  children,
  ...rest
}: IconButtonProps): React.ReactElement {
  const classes = [
    'icon-btn',
    size === 'sm' ? 'icon-btn--sm' : '',
    size === 'xs' ? 'icon-btn--xs' : '',
    tone === 'primary' ? 'icon-btn--primary' : '',
    tone === 'danger' ? 'icon-btn--danger' : '',
    pressed ? 'icon-btn--on' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')
  return (
    <button type="button" aria-label={label} aria-pressed={pressed} className={classes} {...rest}>
      {children}
    </button>
  )
}
