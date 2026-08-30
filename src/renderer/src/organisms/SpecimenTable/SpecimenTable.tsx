import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { faFont, faTextHeight, faBold, faAlignJustify, faTextWidth } from '@fortawesome/free-solid-svg-icons'
import type { TypeScaleStepName } from '@shared/types'
import { isHeadingStep } from '@shared/lib/typeScale'
import { type TypeUnits, formatSize, formatWeight, formatLineHeight, formatTracking } from '../../lib/typeUnits'
import styles from './SpecimenTable.module.css'

export interface SpecimenStep {
  step_name: TypeScaleStepName
  size: number
  weight: number
  line_height: string
  letter_spacing: string
}

interface SpecimenTableProps {
  steps: SpecimenStep[]
  headingStack: string
  bodyStack: string
  previewText: string
  units: TypeUnits
  /** Per-row trailing affordance (create's hover-edit). Omit for the read-only viewer. */
  renderTrailing?: (step: SpecimenStep, index: number) => React.ReactNode
}

/** Sizes at/above this clamp to 2 lines so the giant steps don't run tall; the
 *  rest wrap to 3 lines, enough to actually read the line-height. */
const LARGE_PX = 32

function Head({ icon, label, unit }: { icon: IconDefinition; label: string; unit?: string }): React.ReactElement {
  return (
    <span className={styles.headCell}>
      <FontAwesomeIcon icon={icon} className={styles.headIcon} />
      <span className={styles.headLabel}>{label}</span>
      {unit && <span className={styles.headUnit}>{unit}</span>}
    </span>
  )
}

export function SpecimenTable({
  steps,
  headingStack,
  bodyStack,
  previewText,
  units,
  renderTrailing,
}: SpecimenTableProps): React.ReactElement {
  return (
    <div className={styles.table}>
      {/* Header */}
      <div className={styles.header}>
        <Head icon={faFont} label="Font Style" />
        <div className={styles.metricsHead}>
          <Head icon={faTextHeight} label="Size" unit={units.size} />
          <Head icon={faBold} label="Weight" />
          <Head icon={faAlignJustify} label="Line" unit={units.lineHeight} />
          <Head icon={faTextWidth} label="Tracking" unit={units.tracking} />
        </div>
      </div>

      {/* Steps: specimen-forward, metrics in a footer aligned under the headers. */}
      {steps.map((step, i) => (
        <div key={step.step_name} className={styles.row}>
          <span className={styles.stepName}>{step.step_name}</span>
          <div className={styles.content}>
            <span
              className={[styles.specimen, step.size >= LARGE_PX ? styles.specimenLarge : ''].filter(Boolean).join(' ')}
              style={{
                fontFamily: isHeadingStep(step.step_name) ? headingStack : bodyStack,
                fontSize: `${step.size}px`,
                fontWeight: step.weight,
                lineHeight: step.line_height,
                letterSpacing: step.letter_spacing,
              }}
            >
              {previewText || 'The quick brown fox'}
            </span>
            <div className={styles.metricsRow}>
              <span className={styles.metric}>{formatSize(step.size, units.size)}</span>
              <span className={styles.metric}>{formatWeight(step.weight, units.weight)}</span>
              <span className={styles.metric}>{formatLineHeight(step.line_height, step.size, units.lineHeight)}</span>
              <span className={styles.metric}>{formatTracking(step.letter_spacing, step.size, units.tracking)}</span>
            </div>
          </div>
          {renderTrailing && <span className={styles.trailing}>{renderTrailing(step, i)}</span>}
        </div>
      ))}
    </div>
  )
}
