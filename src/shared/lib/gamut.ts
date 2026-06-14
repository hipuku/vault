import chroma from 'chroma-js'

/** Return an in-gamut hex for the given LCH values, reducing chroma until the
 *  colour fits sRGB. Lightness and hue are preserved. */
export function lchToGamutHex(L: number, C: number, H: number): string {
  let c = C
  for (let i = 0; i < 40; i++) {
    const colour = chroma.lch(L, c, isNaN(H) ? 0 : H)
    if (!colour.clipped()) return colour.hex()
    c -= C / 40
    if (c < 0) c = 0
  }
  return chroma.lch(L, 0, 0).hex()
}
