import chroma from 'chroma-js'

/** Return an in-gamut hex for the given LCH values, reducing chroma until the
 *  colour fits sRGB. Lightness and hue are preserved. */
export function lchToGamutHex(L: number, C: number, H: number): string {
  const h = isNaN(H) ? 0 : H
  if (isNaN(L)) return chroma.lch(0, 0, 0).hex()
  const fits = (c: number): boolean => !chroma.lch(L, c, h).clipped()
  if (fits(C)) return chroma.lch(L, C, h).hex()

  // Bisect rather than walk down in fixed steps: a linear scan's accuracy depended
  // on the *input* chroma, not on the gamut, and lost up to ~3.7 C at the boundary
  // (≈2 ΔE, visible). 20 iterations lands within C/1,000,000 at half the cost.
  let lo = 0
  let hi = C
  for (let i = 0; i < 20; i++) {
    const mid = (lo + hi) / 2
    if (fits(mid)) lo = mid
    else hi = mid
  }
  return chroma.lch(L, lo, h).hex()
}
