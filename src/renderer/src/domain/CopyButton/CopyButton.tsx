import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCopy, faCheck } from '@fortawesome/free-solid-svg-icons'
import { useCopy } from '../../hooks/useCopy'
import styles from './CopyButton.module.css'

interface CopyButtonProps {
  value: string
  label?: string
  /** Render the label in the mono face (for raw values like hex/rgb). */
  mono?: boolean
  /** Fill the container width (e.g. inside a grid cell). */
  block?: boolean
  className?: string
}

/** A chip that copies `value` on click and flips to "Copied ✓" for ~1.2s. */
export function CopyButton({ value, label, mono, block, className }: CopyButtonProps): React.ReactElement {
  const { copy, copied } = useCopy()
  const text = label ?? value
  return (
    <button
      type="button"
      className={[styles.chip, copied ? styles.copied : '', mono ? styles.mono : '', block ? styles.block : '', className].filter(Boolean).join(' ')}
      onClick={() => copy(value)}
      aria-label={`Copy ${text}`}
      title={text}
    >
      <span className={styles.label}>{copied ? 'Copied' : text}</span>
      <FontAwesomeIcon icon={copied ? faCheck : faCopy} className={styles.icon} />
    </button>
  )
}
