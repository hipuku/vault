import React from 'react'
import { contrast, WHITE, BLACK } from '../../lib/colour'
import styles from './ContrastChip.module.css'

interface ContrastChipProps {
  hex: string
  bg: 'white' | 'black'
}

/** A WCAG contrast row: an "Aa" tile rendered in the colour on the given
 *  background, plus the ratio and AA/AAA pass badges. */
export function ContrastChip({ hex, bg }: ContrastChipProps): React.ReactElement {
  const against = bg === 'white' ? WHITE : BLACK
  const { ratio, aa, aaa } = contrast(hex, against)

  return (
    <div className={styles.row}>
      <span className={styles.tile} style={{ background: against, color: hex }}>Aa</span>
      <span className={styles.label}>on {bg}</span>
      <span className={styles.ratio}>{ratio.toFixed(2)}:1</span>
      <span className={[styles.badge, aa ? styles.pass : styles.fail].join(' ')}>AA</span>
      <span className={[styles.badge, aaa ? styles.pass : styles.fail].join(' ')}>AAA</span>
    </div>
  )
}
