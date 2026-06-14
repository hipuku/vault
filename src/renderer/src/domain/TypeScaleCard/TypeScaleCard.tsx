import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPen } from '@fortawesome/free-solid-svg-icons'
import type { TypeScale, TypeScaleStep } from '@shared/types'
import { RATIO_PRESETS } from '@shared/lib/typeScale'
import { Pill } from '../../atoms/Pill/Pill'
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

export function TypeScaleCard({ scale, steps, headingStack, bodyStack, onOpen }: TypeScaleCardProps): React.ReactElement {
  const get = (...names: string[]): TypeScaleStep | undefined => steps.find(s => names.includes(s.step_name))
  // Preset-agnostic: works for both the product (Display/Body/Caption) and
  // markup (H1/Paragraph/Small) presets.
  const heading = get('Display', 'Headline', 'H1') ?? steps[0]
  const body = get('Body', 'Paragraph')
  const caption = get('Caption', 'Small') ?? steps[steps.length - 1]

  return (
    <button type="button" className={styles.card} onClick={() => onOpen(scale)} aria-label={`Open ${scale.name}`}>
      <div className={styles.previewWrap}>
        <div className={styles.preview}>
          {heading && <span style={{ fontFamily: headingStack, fontSize: Math.min(heading.size, 28), fontWeight: heading.weight, lineHeight: 1.1 }}>{PREVIEW}</span>}
          {body && <span style={{ fontFamily: bodyStack, fontSize: 15, fontWeight: body.weight, lineHeight: 1.4 }}>{PREVIEW} jumps over</span>}
          {caption && caption !== body && <span style={{ fontFamily: bodyStack, fontSize: 12, fontWeight: caption.weight, color: 'var(--color-ink-tertiary)' }}>{PREVIEW}</span>}
        </div>
        <span className={styles.edit}><FontAwesomeIcon icon={faPen} /></span>
      </div>

      <div className={styles.body}>
        <div className={styles.nameRow}>
          <span className={styles.name}>{scale.name}</span>
        </div>
        <div className={styles.meta}>
          <Pill label={ratioLabel(scale.ratio)} />
          <span className={styles.value}>{scale.base_size}px</span>
        </div>
      </div>
    </button>
  )
}
