import React, { useId } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faStar, faPen } from '@fortawesome/free-solid-svg-icons'
import type { Font } from '@shared/types'
import { parseWeights, categoryGeneric, categoryLabel } from '../../lib/fontLoader'
import { Chip } from '../../atoms/Chip/Chip'
import styles from './FontCard.module.css'
import { SPECIMEN_TEXT } from '../../lib/specimen'

interface FontCardProps {
  font: Font
  previewText: string
  previewSize: number
  onOpen: (font: Font) => void
}

export function FontCard({ font, previewText, previewSize, onOpen }: FontCardProps): React.ReactElement {
  // The label names the card for what it opens, and replaces its contents for a
  // screen reader, so the meta row and the favourite star were never announced.
  // A hidden description says them as a sentence: pointing at the visible row
  // runs its pieces together, because inline elements get no space between them.
  const metaId = useId()
  const weights = parseWeights(font.weights)
  const stack = `'${font.family}', ${categoryGeneric(font.category)}`

  return (
    <button
      type="button"
      className="card"
      onClick={() => onOpen(font)}
      aria-label={`Open ${font.family}`}
      aria-describedby={metaId}
    >
      <div className={styles.previewWrap}>
        <div className={styles.preview} style={{ fontFamily: stack, fontSize: `${previewSize}px` }}>
          {previewText || SPECIMEN_TEXT}
        </div>
        <span className="card-edit">
          <FontAwesomeIcon icon={faPen} />
        </span>
      </div>

      <div className="card-body card-body--divided">
        <div className="card-name-row">
          {font.favourite === 1 && <FontAwesomeIcon icon={faStar} className="card-fav" />}
          <span className="card-name">{font.family}</span>
        </div>
        <div className="card-meta">
          <Chip label={categoryLabel(font.category)} />
          <span className="card-value">
            {weights.length} weight{weights.length === 1 ? '' : 's'}
          </span>
        </div>
      </div>
      <span id={metaId} className="visually-hidden">
        {`${font.favourite === 1 ? 'Favourite, ' : ''}${categoryLabel(font.category)}, ${weights.length} weight${weights.length === 1 ? '' : 's'}`}
      </span>
    </button>
  )
}
