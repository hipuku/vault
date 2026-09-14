import React, { useId } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPen } from '@fortawesome/free-solid-svg-icons'
import type { TypeScale, TypeScaleStep } from '@shared/types'
import { RATIO_PRESETS } from '@shared/lib/typeScale'
import { Chip } from '../../atoms/Chip/Chip'
import styles from './TypeScaleCard.module.css'

interface TypeScaleCardProps {
  scale: TypeScale
  steps: TypeScaleStep[]
  headingStack: string
  bodyStack: string
  onOpen: (scale: TypeScale) => void
}

const PREVIEW = 'The quick brown fox'

function ratioLabel(ratio: string): string {
  const v = parseFloat(ratio)
  return RATIO_PRESETS.find(p => p.value === v)?.name ?? ratio
}

export function TypeScaleCard({
  scale,
  steps,
  headingStack,
  bodyStack,
  onOpen,
}: TypeScaleCardProps): React.ReactElement {
  // The label names the card for what it opens, and replaces its contents for a
  // screen reader, so the meta row and the favourite star were never announced.
  // A hidden description says them as a sentence: pointing at the visible row
  // runs its pieces together, because inline elements get no space between them.
  const metaId = useId()
  const get = (...names: string[]): TypeScaleStep | undefined => steps.find(s => names.includes(s.step_name))
  // Preset-agnostic: works for both the product (Display/Body/Caption) and
  // markup (H1/Paragraph/Small) presets.
  const heading = get('Display', 'Headline', 'H1') ?? steps[0]
  const body = get('Body', 'Paragraph')
  const caption = get('Caption', 'Small') ?? steps[steps.length - 1]

  return (
    <button
      type="button"
      className="card"
      onClick={() => onOpen(scale)}
      aria-label={`Open ${scale.name}`}
      aria-describedby={metaId}
    >
      <div className={styles.previewWrap}>
        <div className={styles.preview}>
          {heading && (
            <span
              style={{
                fontFamily: headingStack,
                fontSize: Math.min(heading.size, 28),
                fontWeight: heading.weight,
                lineHeight: 1.1,
              }}
            >
              {PREVIEW}
            </span>
          )}
          {body && (
            <span style={{ fontFamily: bodyStack, fontSize: 15, fontWeight: body.weight, lineHeight: 1.4 }}>
              {PREVIEW} jumps over
            </span>
          )}
          {caption && caption !== body && (
            <span
              style={{
                fontFamily: bodyStack,
                fontSize: 12,
                fontWeight: caption.weight,
                color: 'var(--haus-color-ink-tertiary)',
              }}
            >
              {PREVIEW}
            </span>
          )}
        </div>
        <span className="card-edit">
          <FontAwesomeIcon icon={faPen} />
        </span>
      </div>

      <div className="card-body card-body--divided">
        <div className="card-name-row">
          <span className="card-name">{scale.name}</span>
        </div>
        <div className="card-meta">
          <Chip label={ratioLabel(scale.ratio)} />
          <span className="card-value">{scale.base_size}px</span>
        </div>
      </div>
      <span id={metaId} className="visually-hidden">
        {`${ratioLabel(scale.ratio)}, ${scale.base_size}px`}
      </span>
    </button>
  )
}
