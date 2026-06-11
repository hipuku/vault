import React from 'react'
import styles from './IconButton.module.css'

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
  size?: 'sm' | 'md'
}

export function IconButton({
  label,
  size = 'md',
  className,
  children,
  ...rest
}: IconButtonProps): React.ReactElement {
  return (
    <button
      aria-label={label}
      className={[styles.button, styles[size], className].filter(Boolean).join(' ')}
      {...rest}
    >
      {children}
    </button>
  )
}
