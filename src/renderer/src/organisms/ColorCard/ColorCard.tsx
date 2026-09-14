import React, { useId, useMemo } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faStar, faPen } from '@fortawesome/free-solid-svg-icons'
import type { Colour } from '@shared/types'
import { generateLightnessScale } from '@shared/lib/lightnessScale'
import { nearestShadeIndex } from '../../lib/colour'
import { hueFamily } from '../../lib/colourSort'
import { Chip } from '../../atoms/Chip/Chip'
import styles from './ColorCard.module.css'

interface ColorCardProps {
  colour: Colour
  onOpen: (colour: Colour) => void
}

export function ColorCard({ colour, onOpen }: ColorCardProps): React.ReactElement {
  // The label names the card for what it opens, and replaces its contents for a
  // screen reader, so the meta row and the favourite star were never announced.
  // A hidden description says them as a sentence: pointing at the visible row
  // runs its pieces together, because inline elements get no space between them.
  const metaId = useId()
  const shades = useMemo(() => generateLightnessScale(colour.hex), [colour.hex])
  const activeShade = useMemo(() => nearestShadeIndex(colour.hex, shades), [colour.hex, shades])

  return (
    <button
      type="button"
      className={`card ${styles.card}`}
      onClick={() => onOpen(colour)}
      aria-label={`Open ${colour.name}`}
      aria-describedby={metaId}
    >
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
        <span className="card-edit card-edit--on-swatch">
          <FontAwesomeIcon icon={faPen} />
        </span>
      </div>

      <div className="card-body">
        <div className="card-name-row">
          {colour.favourite === 1 && <FontAwesomeIcon icon={faStar} className="card-fav" />}
          <span className="card-name">{colour.name}</span>
        </div>
        <div className="card-meta">
          <Chip label={hueFamily(colour.hex)} />
          <span className="card-value">{colour.hex}</span>
        </div>
      </div>
      <span id={metaId} className="visually-hidden">
        {`${colour.favourite === 1 ? 'Favourite, ' : ''}${hueFamily(colour.hex)}, ${colour.hex}`}
      </span>
    </button>
  )
}
