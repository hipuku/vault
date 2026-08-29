import chroma from 'chroma-js'
import { generateLightnessScale } from './lightnessScale'
import { lchToGamutHex } from './gamut'
import type { RampName, SwatchInput } from '../types'

const STEPS = 10

export const TONAL_STOP_LABELS = ['10', '20', '30', '40', '50', '60', '70', '80', '90', '100']

const SEMANTIC_HUE: Record<'success' | 'warning' | 'error', number> = {
  success: 145,
  warning: 75,
  error:   30,
}

/** The floor is deliberate: a success/warning/error ramp has to read as green/amber/red
 *  even when the seed is muted, so chroma is scaled from the seed but never allowed below
 *  45. The consequence is that a near-grey seed yields saturated semantic ramps that do
 *  not visibly derive from it — only `primary` and `neutral` track a grey seed closely. */
const SEMANTIC_CHROMA_FLOOR = 45

function rotateHue(seedHex: string, targetHue: number, chromaScale: number): string {
  const [L, C] = chroma(seedHex).lch()
  const usableC = Math.max(C * chromaScale, SEMANTIC_CHROMA_FLOOR)
  return lchToGamutHex(L, usableC, targetHue)
}

function toNeutral(seedHex: string): string {
  const [L, , H] = chroma(seedHex).lch()
  return lchToGamutHex(L, 6, H)
}

function rampHexes(name: RampName, seedHex: string): string[] {
  switch (name) {
    case 'primary': return generateLightnessScale(seedHex, { steps: STEPS })
    case 'neutral': return generateLightnessScale(toNeutral(seedHex), { steps: STEPS })
    case 'success': return generateLightnessScale(rotateHue(seedHex, SEMANTIC_HUE.success, 0.85), { steps: STEPS })
    case 'warning': return generateLightnessScale(rotateHue(seedHex, SEMANTIC_HUE.warning, 0.90), { steps: STEPS })
    case 'error':   return generateLightnessScale(rotateHue(seedHex, SEMANTIC_HUE.error,   0.90), { steps: STEPS })
  }
}

export function generateTonalSystem(
  seedHex: string,
  ramps: RampName[],
  seedColourId: number | null = null,
): SwatchInput[] {
  const out: SwatchInput[] = []
  ramps.forEach((name, rampIndex) => {
    const hexes = rampHexes(name, seedHex)
    const isAnchorRamp = name === 'primary'
    const seedL = chroma(seedHex).lch()[0]
    let anchorIdx = -1
    if (isAnchorRamp) {
      let best = Infinity
      hexes.forEach((h, i) => {
        const d = Math.abs(chroma(h).lch()[0] - seedL)
        if (d < best) { best = d; anchorIdx = i }
      })
    }
    hexes.forEach((hex, stopIndex) => {
      out.push({
        hex,
        label: TONAL_STOP_LABELS[stopIndex],
        group_key: name,
        colour_id: stopIndex === anchorIdx ? seedColourId : null,
        sort_order: rampIndex * 100 + stopIndex,
      })
    })
  })
  return out
}
