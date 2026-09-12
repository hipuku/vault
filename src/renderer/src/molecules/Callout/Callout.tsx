import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircleInfo, faTriangleExclamation, faCircleExclamation } from '@fortawesome/free-solid-svg-icons'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import styles from './Callout.module.css'

type Variant = 'info' | 'warning' | 'error'

const DEFAULT_ICON: Record<Variant, IconDefinition> = {
  info: faCircleInfo,
  warning: faTriangleExclamation,
  error: faCircleExclamation,
}

/** The icon is decorative, so without this a screen reader hears an error and a
 *  note as the same thing. */
const TONE_LABEL: Record<Variant, string> = {
  info: 'Note',
  warning: 'Warning',
  error: 'Error',
}

interface CalloutProps {
  variant?: Variant
  /** Override the default per-variant icon. */
  icon?: IconDefinition
  children: React.ReactNode
}

/** A restrained inline callout: tinted subtle background + variant-coloured icon
 *  + text. For form warnings, helper text, and similar notices. */
export function Callout({ variant = 'info', icon, children }: CalloutProps): React.ReactElement {
  return (
    <div className={[styles.callout, styles[variant]].join(' ')} role="note" aria-label={TONE_LABEL[variant]}>
      <FontAwesomeIcon icon={icon ?? DEFAULT_ICON[variant]} className={styles.icon} />
      <div className={styles.body}>{children}</div>
    </div>
  )
}
