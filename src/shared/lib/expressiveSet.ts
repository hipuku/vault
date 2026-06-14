import chroma from 'chroma-js'
import { lchToGamutHex } from './gamut'
import type { FillStrategy, SwatchInput } from '../types'

export const MAX_HUE_GROUPS = 8

const STOP_L = { light: 88, mid: 60, dark: 28 }

interface Seed { hex: string; colourId: number | null }

interface HueGroup {
  H: number
  C: number
  midHex: string
  colourId: number | null
}

function envelope(seeds: Seed[]): { Lmin: number; Lmax: number; Cmean: number } {
  const lch = seeds.map(s => chroma(s.hex).lch())
  const Ls = lch.map(v => v[0])
  const Cs = lch.map(v => v[1])
  return {
    Lmin: Math.min(...Ls),
    Lmax: Math.max(...Ls),
    Cmean: Cs.reduce((a, b) => a + b, 0) / Cs.length,
  }
}

function fillCohesiveDistinct(seeds: Seed[], target: number): HueGroup[] {
  const env = envelope(seeds)
  const midL = (env.Lmin + env.Lmax) / 2

  const groups: HueGroup[] = seeds.map(s => {
    const [, C, H] = chroma(s.hex).lch()
    return { H: isNaN(H) ? 0 : H, C, midHex: s.hex, colourId: s.colourId }
  })

  const candidates: number[] = []
  for (let h = 0; h < 360; h += 5) candidates.push(h)

  while (groups.length < target) {
    const chosenHexes = groups.map(g => g.midHex)
    let bestHue = -1
    let bestScore = -Infinity
    for (const H of candidates) {
      const hex = lchToGamutHex(midL, env.Cmean, H)
      const minDist = Math.min(...chosenHexes.map(c => chroma.deltaE(hex, c)))
      if (minDist > bestScore) { bestScore = minDist; bestHue = H }
    }
    const midHex = lchToGamutHex(midL, env.Cmean, bestHue)
    groups.push({ H: bestHue, C: env.Cmean, midHex, colourId: null })
  }
  return groups
}

function fillInterpolate(seeds: Seed[], target: number): HueGroup[] {
  const env = envelope(seeds)
  const midL = (env.Lmin + env.Lmax) / 2
  const seedGroups: HueGroup[] = seeds.map(s => {
    const [, C, H] = chroma(s.hex).lch()
    return { H: isNaN(H) ? 0 : H, C, midHex: s.hex, colourId: s.colourId }
  })
  if (seedGroups.length >= target) return seedGroups

  const sorted = [...seedGroups].sort((a, b) => a.H - b.H)
  const extra = target - sorted.length
  const result = [...sorted]
  for (let i = 0; i < extra; i++) {
    let gapIdx = 0, gapSize = -1
    for (let j = 0; j < result.length; j++) {
      const a = result[j], b = result[(j + 1) % result.length]
      const span = ((b.H - a.H) % 360 + 360) % 360
      if (span > gapSize) { gapSize = span; gapIdx = j }
    }
    const a = result[gapIdx], b = result[(gapIdx + 1) % result.length]
    const H = (a.H + gapSize / 2) % 360
    const C = (a.C + b.C) / 2
    const midHex = lchToGamutHex(midL, C, H)
    result.splice(gapIdx + 1, 0, { H, C, midHex, colourId: null })
  }
  return result
}

function fillHarmony(seeds: Seed[], target: number): HueGroup[] {
  const [, C0, H0] = chroma(seeds[0].hex).lch()
  const env = envelope(seeds)
  const midL = (env.Lmin + env.Lmax) / 2
  const seedGroups: HueGroup[] = seeds.map(s => {
    const [, C, H] = chroma(s.hex).lch()
    return { H: isNaN(H) ? 0 : H, C, midHex: s.hex, colourId: s.colourId }
  })
  const result = [...seedGroups]
  const step = 360 / target
  let k = 1
  while (result.length < target) {
    const H = ((isNaN(H0) ? 0 : H0) + k * step) % 360
    const midHex = lchToGamutHex(midL, C0, H)
    result.push({ H, C: C0, midHex, colourId: null })
    k++
  }
  return result
}

function expand(groups: HueGroup[]): SwatchInput[] {
  const out: SwatchInput[] = []
  groups.forEach((g, gi) => {
    const groupKey = `hue-${gi}`
    const light = lchToGamutHex(STOP_L.light, g.C * 0.55, g.H)
    const dark  = lchToGamutHex(STOP_L.dark,  g.C * 0.70, g.H)
    out.push({ hex: light,    label: 'light', group_key: groupKey, colour_id: null,       sort_order: gi * 3 + 0 })
    out.push({ hex: g.midHex, label: '',      group_key: groupKey, colour_id: g.colourId, sort_order: gi * 3 + 1 })
    out.push({ hex: dark,     label: 'dark',  group_key: groupKey, colour_id: null,       sort_order: gi * 3 + 2 })
  })
  return out
}

export function generateExpressiveSet(
  seeds: Seed[],
  targetCount: number,
  strategy: FillStrategy,
): SwatchInput[] {
  const target = Math.max(seeds.length, Math.min(targetCount, MAX_HUE_GROUPS))
  let groups: HueGroup[]
  if (strategy === 'interpolate')   groups = fillInterpolate(seeds, target)
  else if (strategy === 'harmony')  groups = fillHarmony(seeds, target)
  else                              groups = fillCohesiveDistinct(seeds, target)
  return expand(groups)
}
