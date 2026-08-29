import chroma from 'chroma-js'

// A uniform tag palette: fixed OKLCH lightness + chroma, hue swept evenly
// around the wheel. One scale, every swatch the same perceptual weight — and
// all in sRGB gamut at L 0.64 / C 0.11 so none are silently clipped.
const COUNT = 12
const LIGHTNESS = 0.64
const CHROMA = 0.11

export const TAG_COLOURS: string[] = Array.from({ length: COUNT }, (_, i) =>
  chroma.oklch(LIGHTNESS, CHROMA, (i * 360) / COUNT).hex(),
)
