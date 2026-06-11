import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faStar, faPen } from '@fortawesome/free-solid-svg-icons'
import type { Colour } from '@shared/types'
import { prefersDarkText } from '../../lib/colour'
import { ContrastBadges } from '../ContrastBadges/ContrastBadges'
import styles from './ColorCard.module.css'

interface ColorCardProps {
  colour: Colour
  onOpen: (colour: Colour) => void
}

export function ColorCard({ colour, onOpen }: ColorCardProps): React.ReactElement {
  const ink = prefersDarkText(colour.hex) ? '#000' : '#fff'
  return (
    <div className={styles.card}>
      <button
        type="button"
        className={styles.swatch}
        style={{ background: colour.hex }}
        onClick={() => onOpen(colour)}
        aria-label={`Open ${colour.name}`}
      >
        {colour.favourite === 1 && (
          <span className={styles.fav} style={{ color: ink }}><FontAwesomeIcon icon={faStar} /></span>
        )}
        <span className={styles.edit} style={{ color: ink }}><FontAwesomeIcon icon={faPen} /></span>
      </button>

      <div className={styles.body}>
        <span className={styles.name}>{colour.name}</span>
        <span className={styles.hex}>{colour.hex}</span>
        <ContrastBadges hex={colour.hex} />
      </div>
    </div>
  )
}
