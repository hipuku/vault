import React from 'react'
import styles from './Divider.module.css'

interface DividerProps extends React.HTMLAttributes<HTMLHRElement> {}

export function Divider({ className, ...rest }: DividerProps): React.ReactElement {
  return <hr className={[styles.divider, className].filter(Boolean).join(' ')} {...rest} />
}
