interface StepLike {
  step_name: string
  size: number
  weight: number
  line_height: string
  letter_spacing: string
}

function slug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

/** CSS custom properties for one step (size, weight, leading, tracking). */
export function stepToCss(step: StepLike): string {
  const s = slug(step.step_name)
  return [
    `--type-${s}: ${step.size}px;`,
    `--type-${s}-weight: ${step.weight};`,
    `--type-${s}-leading: ${step.line_height};`,
    `--type-${s}-tracking: ${step.letter_spacing};`,
  ].join('\n')
}

/** Full `:root { … }` block for an entire scale. */
export function scaleToCss(steps: StepLike[]): string {
  const body = steps
    .map(s => stepToCss(s).split('\n').map(l => `  ${l}`).join('\n'))
    .join('\n')
  return `:root {\n${body}\n}`
}

/** Compact metadata line shown beside each specimen. */
export function stepMeta(step: StepLike): string {
  return `${step.size}px · ${step.weight} · ${step.line_height} · ${step.letter_spacing}`
}
