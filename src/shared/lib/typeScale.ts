import type { TypeScaleStepName, TypeScaleStepInput } from '../types'

interface StepDef {
  name: TypeScaleStepName
  /** Power of the ratio relative to the body base. Tuned so the defaults at
   *  Perfect Fourth (1.333) match the PRD's named-step size table. */
  exponent: number
  weight: number
  lineHeight: string
  letterSpacing: string
}

export const TYPE_STEPS: StepDef[] = [
  { name: 'Display',    exponent: 5.25, weight: 700, lineHeight: '1.1',  letterSpacing: '-0.02em' },
  { name: 'H1',         exponent: 3.83, weight: 700, lineHeight: '1.15', letterSpacing: '-0.02em' },
  { name: 'H2',         exponent: 2.82, weight: 600, lineHeight: '1.2',  letterSpacing: '-0.01em' },
  { name: 'H3',         exponent: 1.95, weight: 600, lineHeight: '1.25', letterSpacing: '0' },
  { name: 'H4',         exponent: 1.11, weight: 600, lineHeight: '1.3',  letterSpacing: '0' },
  { name: 'H5',         exponent: 0.41, weight: 500, lineHeight: '1.35', letterSpacing: '0' },
  { name: 'H6',         exponent: 0,    weight: 500, lineHeight: '1.4',  letterSpacing: '0' },
  { name: 'Body Large', exponent: 0.41, weight: 400, lineHeight: '1.6',  letterSpacing: '0' },
  { name: 'Body',       exponent: 0,    weight: 400, lineHeight: '1.6',  letterSpacing: '0' },
  { name: 'Body Small', exponent: -0.46, weight: 400, lineHeight: '1.5', letterSpacing: '0' },
  { name: 'Caption',    exponent: -1,   weight: 400, lineHeight: '1.5',  letterSpacing: '0.02em' },
  { name: 'Label',      exponent: -1.3, weight: 500, lineHeight: '1.4',  letterSpacing: '0.08em' },
]

/** Which steps render in the heading font vs the body font by default. */
export function isHeadingStep(name: TypeScaleStepName): boolean {
  return ['Display', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(name)
}

export function generateTypeScaleSteps(baseSize: number, ratio: number): TypeScaleStepInput[] {
  return TYPE_STEPS.map((s, i) => ({
    step_name: s.name,
    size: Math.round(baseSize * Math.pow(ratio, s.exponent)),
    weight: s.weight,
    line_height: s.lineHeight,
    letter_spacing: s.letterSpacing,
    sort_order: i,
  }))
}

export interface RatioPreset {
  name: string
  value: number
  recommended?: boolean
}

export const RATIO_PRESETS: RatioPreset[] = [
  { name: 'Minor Second', value: 1.067 },
  { name: 'Major Second', value: 1.125 },
  { name: 'Minor Third', value: 1.2 },
  { name: 'Major Third', value: 1.25 },
  { name: 'Perfect Fourth', value: 1.333, recommended: true },
  { name: 'Augmented Fourth', value: 1.414 },
  { name: 'Perfect Fifth', value: 1.5 },
  { name: 'Golden Ratio', value: 1.618 },
]
