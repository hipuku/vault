import React from 'react'
import { contrast, WHITE, BLACK } from '../../lib/colour'
import styles from './ContrastBadges.module.css'

function level(ratio: number): { label: string; cls: string } {
  if (ratio >= 7)   return { label: 'AAA', cls: styles.pass }
  if (ratio >= 4.5) return { label: 'AA',  cls: styles.pass }
  return { label: 'Fail', cls: styles.fail }
}

function Badge({ bg, hex }: { bg: 'white' | 'black'; hex: string }): React.ReactElement {
  const against = bg === 'white' ? WHITE : BLACK
  const { ratio } = contrast(hex, against)
  const { label, cls } = level(ratio)
  return (
    <span className={[styles.badge, cls].join(' ')} title={`${ratio.toFixed(2)}:1 against ${bg}`}>
      <span className={styles.dot} style={{ background: against }} />
      {label}
    </span>
  )
}

/** Compact WCAG contrast indicators against white and black backgrounds. */
export function ContrastBadges({ hex }: { hex: string }): React.ReactElement {
  return (
    <div className={styles.row}>
      <Badge bg="white" hex={hex} />
      <Badge bg="black" hex={hex} />
    </div>
  )
}
