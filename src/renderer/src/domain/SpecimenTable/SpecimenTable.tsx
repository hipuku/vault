import React from 'react'
import type { TypeScaleStepName } from '@shared/types'
import { isHeadingStep } from '@shared/lib/typeScale'
import { stepMeta } from '../../lib/typeScaleCss'
import styles from './SpecimenTable.module.css'

export interface SpecimenStep {
  step_name: TypeScaleStepName
  size: number
  weight: number
  line_height: string
  letter_spacing: string
}

export type PreviewMode = 'role' | 'heading' | 'body'

interface SpecimenTableProps {
  steps: SpecimenStep[]
  headingStack: string
  bodyStack: string
  previewText: string
  mode: PreviewMode
  renderTrailing?: (step: SpecimenStep, index: number) => React.ReactNode
}

function resolveStack(name: TypeScaleStepName, mode: PreviewMode, heading: string, body: string): string {
  if (mode === 'heading') return heading
  if (mode === 'body') return body
  return isHeadingStep(name) ? heading : body
}

export function SpecimenTable({ steps, headingStack, bodyStack, previewText, mode, renderTrailing }: SpecimenTableProps): React.ReactElement {
  return (
    <div className={styles.table}>
      {steps.map((step, i) => (
        <div key={step.step_name} className={styles.row}>
          <span className={styles.label}>{step.step_name}</span>
          <span
            className={styles.specimen}
            style={{
              fontFamily: resolveStack(step.step_name, mode, headingStack, bodyStack),
              fontSize: `${step.size}px`,
              fontWeight: step.weight,
              lineHeight: step.line_height,
              letterSpacing: step.letter_spacing,
            }}
          >
            {previewText || 'The quick brown fox'}
          </span>
          <span className={styles.meta}>{stepMeta(step)}</span>
          {renderTrailing && <span className={styles.trailing}>{renderTrailing(step, i)}</span>}
        </div>
      ))}
    </div>
  )
}
