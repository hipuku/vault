import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faStar, faPen } from '@fortawesome/free-solid-svg-icons'
import type { Font } from '@shared/types'
import { parseWeights, categoryGeneric, categoryLabel } from '../../lib/fontLoader'
import { Pill } from '../../atoms/Pill/Pill'
import styles from './FontCard.module.css'

interface FontCardProps {
  font: Font
  previewText: string
  previewSize: number
  onOpen: (font: Font) => void
}

export function FontCard({ font, previewText, previewSize, onOpen }: FontCardProps): React.ReactElement {
  const weights = parseWeights(font.weights)
  const stack = `'${font.family}', ${categoryGeneric(font.category)}`

  return (
    <button type="button" className={styles.card} onClick={() => onOpen(font)} aria-label={`Open ${font.family}`}>
      <div className={styles.previewWrap}>
        <div className={styles.preview} style={{ fontFamily: stack, fontSize: `${previewSize}px` }}>
          {previewText || 'The quick brown fox'}
        </div>
        <span className={styles.edit}><FontAwesomeIcon icon={faPen} /></span>
      </div>

      <div className={styles.body}>
        <div className={styles.nameRow}>
          {font.favourite === 1 && <FontAwesomeIcon icon={faStar} className={styles.favInline} />}
          <span className={styles.name}>{font.family}</span>
        </div>
        <div className={styles.meta}>
          <Pill label={categoryLabel(font.category)} />
          <span className={styles.value}>{weights.length} weight{weights.length === 1 ? '' : 's'}</span>
        </div>
      </div>
    </button>
  )
}
