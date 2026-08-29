import chroma from 'chroma-js'
import { lchToGamutHex } from './gamut'

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
    // steps === 1 would divide by zero, and NaN reaches chroma.lch as black.
    const t = steps === 1 ? 0 : i / (steps - 1)
    const L = maxL - t * (maxL - minL)
    const cScale = 1 - Math.abs(t - 0.5) * 0.9
    const C = c * cScale
    // Via lchToGamutHex, not chroma.lch directly: chroma clamps RGB channels for an
    // out-of-gamut request, which moves lightness as well as chroma and cost the light
    // end of a saturated ramp ~5 L*. It never throws, so the try/catch this replaced
    // was dead code.
    return lchToGamutHex(L, C, h)
  })
}
