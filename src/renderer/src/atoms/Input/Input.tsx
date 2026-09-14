import React, { useId } from 'react'
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
  /** A unit set after the value inside the field, such as px. StepEditControl and
   *  TypeScaleCreate each drew this field by hand. The unit describes the input,
   *  so a screen reader hears "16, px" rather than a bare number. */
  unit?: string
}

export function Input({ className, error, size = 'lg', mono, unit, ...rest }: InputProps): React.ReactElement {
  const unitId = useId()
  const classes = [styles.input, styles[size], mono ? styles.mono : '', error ? styles.error : '']

  if (!unit) {
    return (
      <input
        className={[...classes, className].filter(Boolean).join(' ')}
        aria-invalid={error || undefined}
        {...rest}
      />
    )
  }

  // With a unit, the box is a wrapper and the input inside it is bare, so the
  // unit sits in the same border and the ring follows focus within.
  const describedBy = [rest['aria-describedby'], unitId].filter(Boolean).join(' ')
  return (
    <span
      className={[...classes, styles.withUnit, rest.disabled ? styles.disabled : '', className]
        .filter(Boolean)
        .join(' ')}
    >
      <input className={styles.bare} aria-invalid={error || undefined} {...rest} aria-describedby={describedBy} />
      <span id={unitId} className={styles.unit}>
        {unit}
      </span>
    </span>
  )
}
