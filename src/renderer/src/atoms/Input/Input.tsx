import React from 'react'
import styles from './Input.module.css'

/** The native `size` attribute is omitted deliberately: it sizes an input in
 *  characters, nothing in this app uses it, and the name is worth more as the
 *  control height. */
interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  error?: boolean
  /** `md` is the compact field for a popover or a dense row: control-height-md
   *  with tighter padding. `lg` is the default and is what a form uses. */
  size?: 'md' | 'lg'
  /** Sets the value in the mono face, for a raw value such as a hex. The
   *  placeholder stays in the sans face, because it is words. */
  mono?: boolean
}

export function Input({ className, error, size = 'lg', mono, ...rest }: InputProps): React.ReactElement {
  return (
    <input
      className={[styles.input, styles[size], mono ? styles.mono : '', error ? styles.error : '', className]
        .filter(Boolean)
        .join(' ')}
      aria-invalid={error || undefined}
      {...rest}
    />
  )
}
