import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faStar } from '@fortawesome/free-solid-svg-icons'
import type { TypeScale, TypeScaleStep } from '@shared/types'
import styles from './TypeScaleCard.module.css'

interface TypeScaleCardProps {
  scale: TypeScale
  steps: TypeScaleStep[]
  headingStack: string
  bodyStack: string
  onOpen: (scale: TypeScale) => void
  onToggleFavourite: (id: number, favourite: 0 | 1) => void
}

const PREVIEW = 'The quick brown fox'

export function TypeScaleCard({ scale, steps, headingStack, bodyStack, onOpen, onToggleFavourite }: TypeScaleCardProps): React.ReactElement {
  const get = (name: string): TypeScaleStep | undefined => steps.find(s => s.step_name === name)
  const h1 = get('H1')
  const body = get('Body')
  const caption = get('Caption')

  return (
    <div className={styles.card}>
      <button type="button" className={styles.preview} onClick={() => onOpen(scale)} aria-label={`Open ${scale.name}`}>
        {h1 && <span style={{ fontFamily: headingStack, fontSize: Math.min(h1.size, 28), fontWeight: h1.weight, lineHeight: 1.1 }}>{PREVIEW}</span>}
        {body && <span style={{ fontFamily: bodyStack, fontSize: 15, fontWeight: body.weight, lineHeight: 1.4 }}>{PREVIEW} jumps over</span>}
        {caption && <span style={{ fontFamily: bodyStack, fontSize: 12, fontWeight: caption.weight, color: 'var(--color-ink-tertiary)' }}>{PREVIEW}</span>}
      </button>

      <div className={styles.footer}>
        <span className={styles.name}>{scale.name}</span>
        <button
          type="button"
          className={[styles.star, scale.favourite ? styles.starOn : ''].filter(Boolean).join(' ')}
          onClick={() => onToggleFavourite(scale.id, scale.favourite ? 0 : 1)}
          aria-label={scale.favourite ? 'Unfavourite' : 'Favourite'}
        >
          <FontAwesomeIcon icon={faStar} />
        </button>
      </div>
    </div>
  )
}
