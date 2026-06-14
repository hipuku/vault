import chroma from 'chroma-js'

export type QualityRating = 'good' | 'fair' | 'poor'

export interface HueArcResult {
  totalAngle: number
  hues: number[]
}

export interface ChromaResult {
  rating: QualityRating
  mean: number
  min: number
  max: number
}

export interface LightnessResult {
  rating: QualityRating
  mean: number
  min: number
  max: number
}

export interface NearIdenticalPair {
  indexA: number
  indexB: number
  hexA: string
  hexB: string
  deltaE: number
}

/** Compute the arc of hue coverage across the mid hexes (in degrees, 0–360). */
export function analyseHueArc(midHexes: string[]): HueArcResult {
  const hues = midHexes.map(h => {
    const [, , H] = chroma(h).lch()
    return isNaN(H) ? 0 : H
  })
  if (hues.length <= 1) return { totalAngle: 0, hues }

  const sorted = [...hues].sort((a, b) => a - b)
  // largest gap in the circle determines coverage
  let maxGap = 0
  for (let i = 0; i < sorted.length; i++) {
    const next = sorted[(i + 1) % sorted.length]
    const gap = ((next - sorted[i]) % 360 + 360) % 360
    if (gap > maxGap) maxGap = gap
  }
  const totalAngle = Math.round(360 - maxGap)
  return { totalAngle, hues }
}

/** Analyse the chroma distribution across the mid hexes. */
export function analyseChroma(midHexes: string[]): ChromaResult {
  const chromas = midHexes.map(h => chroma(h).lch()[1])
  const mean = chromas.reduce((a, b) => a + b, 0) / chromas.length
  const min = Math.min(...chromas)
  const max = Math.max(...chromas)
  const spread = max - min
  let rating: QualityRating
  if (spread < 20 && mean > 30) rating = 'good'
  else if (spread < 40) rating = 'fair'
  else rating = 'poor'
  return { rating, mean: Math.round(mean), min: Math.round(min), max: Math.round(max) }
}

/** Analyse the lightness distribution across the mid hexes. */
export function analyseLightness(midHexes: string[]): LightnessResult {
  const lightnesses = midHexes.map(h => chroma(h).lch()[0])
  const mean = lightnesses.reduce((a, b) => a + b, 0) / lightnesses.length
  const min = Math.min(...lightnesses)
  const max = Math.max(...lightnesses)
  const spread = max - min
  let rating: QualityRating
  if (spread < 15) rating = 'good'
  else if (spread < 30) rating = 'fair'
  else rating = 'poor'
  return { rating, mean: Math.round(mean), min: Math.round(min), max: Math.round(max) }
}

export interface RampResult {
  span: number              // lightness range covered (0–100)
  rangeRating: QualityRating
  evenRating: QualityRating // perceptual evenness of the steps
}

/** Analyse a tonal ramp (fixed hue, varying lightness): does it cover a wide
 *  lightness range, and are the steps perceptually even? */
export function analyseRamp(hexes: string[]): RampResult {
  const Ls = hexes.map(h => chroma(h).lch()[0]).sort((a, b) => b - a) // light → dark
  const span = Ls[0] - Ls[Ls.length - 1]
  const rangeRating: QualityRating = span >= 75 ? 'good' : span >= 50 ? 'fair' : 'poor'

  const deltas: number[] = []
  for (let i = 1; i < Ls.length; i++) deltas.push(Ls[i - 1] - Ls[i])
  const mean = deltas.reduce((a, b) => a + b, 0) / (deltas.length || 1)
  const sd = Math.sqrt(deltas.reduce((a, b) => a + (b - mean) ** 2, 0) / (deltas.length || 1))
  const evenRating: QualityRating = sd <= 3.5 ? 'good' : sd <= 7 ? 'fair' : 'poor'

  return { span: Math.round(span), rangeRating, evenRating }
}

/** Find pairs of mid hexes whose CIEDE2000 distance is below the threshold (default 2.5). */
export function findNearIdentical(midHexes: string[], threshold = 2.5): NearIdenticalPair[] {
  const pairs: NearIdenticalPair[] = []
  for (let i = 0; i < midHexes.length; i++) {
    for (let j = i + 1; j < midHexes.length; j++) {
      const deltaE = chroma.deltaE(midHexes[i], midHexes[j])
      if (deltaE < threshold) {
        pairs.push({ indexA: i, indexB: j, hexA: midHexes[i], hexB: midHexes[j], deltaE: Math.round(deltaE * 100) / 100 })
      }
    }
  }
  return pairs
}
