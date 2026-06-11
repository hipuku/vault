import chroma from 'chroma-js'

export interface LightnessScaleOptions {
  steps?: number
  minL?: number
  maxL?: number
}

/**
 * Perceptual lightness ramp from a base hex via LCH: lightness sweeps
 * maxL→minL, chroma eases toward the mid-tones, hue held. Shared by the main
 * process (persisting palettes) and the renderer (live creation preview).
 */
export function generateLightnessScale(
  hex: string,
  options: LightnessScaleOptions = {}
): string[] {
  const { steps = 10, minL = 8, maxL = 97 } = options
  const base = chroma(hex)
  const [, c, h] = base.lch()

  return Array.from({ length: steps }, (_, i) => {
    const t = i / (steps - 1)
    const L = maxL - t * (maxL - minL)
    const cScale = 1 - Math.abs(t - 0.5) * 0.9
    const C = c * cScale
    try {
      return chroma.lch(L, C, isNaN(h) ? 0 : h).hex()
    } catch {
      return chroma.lch(L, 0, 0).hex()
    }
  })
}
