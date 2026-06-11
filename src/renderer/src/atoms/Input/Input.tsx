import React from 'react'
import styles from './Input.module.css'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
}

export function Input({ className, error, ...rest }: InputProps): React.ReactElement {
  return (
    <input
      className={[styles.input, error ? styles.error : '', className].filter(Boolean).join(' ')}
      aria-invalid={error || undefined}
      {...rest}
    />
  )
}
