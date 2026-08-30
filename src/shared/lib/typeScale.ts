import type { TypeScaleStepName, TypeScaleStepInput, TypeScaleKind } from '../types'

interface StepDef {
  name: TypeScaleStepName
  /** Power of the ratio relative to the body base. Tuned so the defaults at
   *  Perfect Fourth (1.333) match the PRD's named-step size table. */
  exponent: number
  weight: number
  lineHeight: string
  letterSpacing: string
  /** Renders in the heading font (vs the body font) by default. */
  heading: boolean
}

/** Product/semantic roles: Display→Label, like Material and most design systems. */
const SEMANTIC_STEPS: StepDef[] = [
  { name: 'Display', exponent: 5.25, weight: 700, lineHeight: '1.1', letterSpacing: '-0.02em', heading: true },
  { name: 'Headline', exponent: 3.83, weight: 700, lineHeight: '1.15', letterSpacing: '-0.02em', heading: true },
  { name: 'Title', exponent: 2.82, weight: 600, lineHeight: '1.2', letterSpacing: '-0.01em', heading: true },
  { name: 'Body Large', exponent: 0.41, weight: 400, lineHeight: '1.6', letterSpacing: '0', heading: false },
  { name: 'Body', exponent: 0, weight: 400, lineHeight: '1.6', letterSpacing: '0', heading: false },
  { name: 'Body Small', exponent: -0.46, weight: 400, lineHeight: '1.5', letterSpacing: '0', heading: false },
  { name: 'Caption', exponent: -1, weight: 400, lineHeight: '1.5', letterSpacing: '0.02em', heading: false },
  { name: 'Label', exponent: -1.3, weight: 500, lineHeight: '1.4', letterSpacing: '0.08em', heading: false },
]

/** HTML markup: h1–h6, paragraph and small, mapping 1:1 to web-document tags. */
const MARKUP_STEPS: StepDef[] = [
  { name: 'H1', exponent: 3.83, weight: 700, lineHeight: '1.15', letterSpacing: '-0.02em', heading: true },
  { name: 'H2', exponent: 2.82, weight: 700, lineHeight: '1.2', letterSpacing: '-0.01em', heading: true },
  { name: 'H3', exponent: 1.95, weight: 600, lineHeight: '1.25', letterSpacing: '0', heading: true },
  { name: 'H4', exponent: 1.11, weight: 600, lineHeight: '1.3', letterSpacing: '0', heading: true },
  { name: 'H5', exponent: 0.41, weight: 600, lineHeight: '1.35', letterSpacing: '0', heading: true },
  { name: 'H6', exponent: 0, weight: 600, lineHeight: '1.4', letterSpacing: '0', heading: true },
  { name: 'Paragraph', exponent: 0, weight: 400, lineHeight: '1.6', letterSpacing: '0', heading: false },
  { name: 'Small', exponent: -0.46, weight: 400, lineHeight: '1.5', letterSpacing: '0', heading: false },
]

export const STEP_PRESETS: Record<TypeScaleKind, StepDef[]> = {
  semantic: SEMANTIC_STEPS,
  markup: MARKUP_STEPS,
}

export const KIND_LABELS: Record<TypeScaleKind, string> = {
  semantic: 'Product',
  markup: 'Web / Markup',
}

/** Every step name that renders in the heading font, across all presets. */
const HEADING_STEPS = new Set<TypeScaleStepName>(
  Object.values(STEP_PRESETS).flatMap(steps => steps.filter(s => s.heading).map(s => s.name)),
)

/** Which steps render in the heading font vs the body font by default. */
export function isHeadingStep(name: TypeScaleStepName): boolean {
  return HEADING_STEPS.has(name)
}

/** Infer which preset a saved scale came from, by its step names. */
export function detectKind(stepNames: string[]): TypeScaleKind {
  return stepNames.some(n => /^H[1-6]$/.test(n)) ? 'markup' : 'semantic'
}

interface StepMetrics {
  step_name: string
  size: number
  weight: number
  line_height: string
  letter_spacing: string
}

/** True when a scale's steps no longer match the ramp its base/ratio would
 *  generate, i.e. it's been hand-tuned and is no longer a named ratio. */
export function isCustomScale(steps: StepMetrics[], baseSize: number, ratio: number): boolean {
  const kind = detectKind(steps.map(s => s.step_name))
  const generated = generateTypeScaleSteps(baseSize, ratio, kind)
  if (generated.length !== steps.length) return true
  return steps.some(s => {
    const g = generated.find(x => x.step_name === s.step_name)
    return (
      !g ||
      g.size !== s.size ||
      g.weight !== s.weight ||
      g.line_height !== s.line_height ||
      g.letter_spacing !== s.letter_spacing
    )
  })
}

export function generateTypeScaleSteps(
  baseSize: number,
  ratio: number,
  kind: TypeScaleKind = 'semantic',
): TypeScaleStepInput[] {
  return STEP_PRESETS[kind].map((s, i) => ({
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
