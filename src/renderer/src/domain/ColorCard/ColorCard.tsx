import React, { useMemo } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faStar, faPen } from '@fortawesome/free-solid-svg-icons'
import type { Colour } from '@shared/types'
import { generateLightnessScale } from '@shared/lib/lightnessScale'
import { nearestShadeIndex } from '../../lib/colour'
import { hueFamily } from '../../lib/colourSort'
import { Pill } from '../../atoms/Pill/Pill'
import styles from './ColorCard.module.css'

interface ColorCardProps {
  colour: Colour
  onOpen: (colour: Colour) => void
}

export function ColorCard({ colour, onOpen }: ColorCardProps): React.ReactElement {
  const shades = useMemo(() => generateLightnessScale(colour.hex), [colour.hex])
  const activeShade = useMemo(() => nearestShadeIndex(colour.hex, shades), [colour.hex, shades])

  return (
    <button type="button" className={styles.card} onClick={() => onOpen(colour)} aria-label={`Open ${colour.name}`}>
      <div className={styles.swatch} style={{ background: colour.hex }}>
        <div className={styles.shades} aria-hidden>
          {shades.map((s, i) => (
            <span
              key={i}
              className={[styles.shade, i === activeShade ? styles.shadeActive : ''].filter(Boolean).join(' ')}
              style={{ background: s }}
            />
          ))}
        </div>
        <span className={styles.edit}><FontAwesomeIcon icon={faPen} /></span>
      </div>

      <div className={styles.body}>
        <div className={styles.nameRow}>
          {colour.favourite === 1 && <FontAwesomeIcon icon={faStar} className={styles.favInline} />}
          <span className={styles.name}>{colour.name}</span>
        </div>
        <div className={styles.meta}>
          <Pill label={hueFamily(colour.hex)} />
          <span className={styles.hex}>{colour.hex}</span>
        </div>
      </div>
    </button>
  )
}
