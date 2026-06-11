import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faStar } from '@fortawesome/free-solid-svg-icons'
import type { Font } from '@shared/types'
import { parseWeights, categoryGeneric } from '../../lib/fontLoader'
import styles from './FontCard.module.css'

interface FontCardProps {
  font: Font
  previewText: string
  previewSize: number
  onOpen: (font: Font) => void
  onToggleFavourite: (id: number, favourite: 0 | 1) => void
}

function weightSummary(weights: string[]): string {
  if (weights.length <= 4) return weights.join(' · ')
  return `${weights.length} weights`
}

export function FontCard({ font, previewText, previewSize, onOpen, onToggleFavourite }: FontCardProps): React.ReactElement {
  const weights = parseWeights(font.weights)
  const stack = `'${font.family}', ${categoryGeneric(font.category)}`

  return (
    <div className={styles.card}>
      <button
        type="button"
        className={styles.preview}
        style={{ fontFamily: stack, fontSize: `${previewSize}px` }}
        onClick={() => onOpen(font)}
        aria-label={`Open ${font.family}`}
      >
        {previewText || 'The quick brown fox'}
      </button>

      <div className={styles.footer}>
        <div className={styles.nameRow}>
          <span className={styles.name} style={{ fontFamily: stack }}>{font.family}</span>
          <button
            type="button"
            className={[styles.star, font.favourite ? styles.starOn : ''].filter(Boolean).join(' ')}
            onClick={() => onToggleFavourite(font.id, font.favourite ? 0 : 1)}
            aria-label={font.favourite ? 'Unfavourite' : 'Favourite'}
          >
            <FontAwesomeIcon icon={faStar} />
          </button>
        </div>
        <span className={styles.meta}>
          {font.category} · {font.source === 'google' ? 'Google Fonts' : 'Local file'}
        </span>
        <span className={styles.weights}>{weightSummary(weights)}</span>
      </div>
    </div>
  )
}
