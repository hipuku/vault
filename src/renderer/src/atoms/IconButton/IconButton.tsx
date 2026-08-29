import React from 'react'

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
  size?: 'xs' | 'sm' | 'md'
  tone?: 'neutral' | 'primary' | 'danger'
}

/** The canonical icon-only button. Renders the locked `.icon-btn` pattern from
 *  global.css (transparent → circular tinted bg + colour shift on hover). */
export function IconButton({
  label,
  size = 'md',
  tone = 'neutral',
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
    className,
  ]
    .filter(Boolean)
    .join(' ')
  return (
    <button aria-label={label} className={classes} {...rest}>
      {children}
    </button>
  )
}
