import { differenceCiede2000, formatHex } from 'culori'

const deltaE = differenceCiede2000()

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Could not load image'))
    img.src = src
  })
}

interface Bucket {
  r: number
  g: number
  b: number
  n: number
}

/**
 * Extracts up to `count` dominant colours from an image data URL using the
 * Canvas API: downscale → bucket pixels in a coarse RGB grid by frequency →
 * average each bucket → merge near-duplicates by ΔE2000. Returns hex strings,
 * most-frequent first.
 */
export async function extractDominantColours(dataUrl: string, count = 8): Promise<string[]> {
  const img = await loadImage(dataUrl)

  const longest = Math.max(img.width, img.height)
  const scale = Math.min(1, 140 / longest)
  const w = Math.max(1, Math.round(img.width * scale))
  const h = Math.max(1, Math.round(img.height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return []
  ctx.drawImage(img, 0, 0, w, h)
  const { data } = ctx.getImageData(0, 0, w, h)

  const buckets = new Map<string, Bucket>()
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 125) continue // skip mostly-transparent pixels
    const r = data[i],
      g = data[i + 1],
      b = data[i + 2]
    const key = `${r >> 4}-${g >> 4}-${b >> 4}` // 4 bits/channel → 4096 cells
    const e = buckets.get(key)
    if (e) {
      e.r += r
      e.g += g
      e.b += b
      e.n++
    } else buckets.set(key, { r, g, b, n: 1 })
  }

  const sorted = [...buckets.values()].sort((a, b) => b.n - a.n)

  const hexes: string[] = []
  for (const e of sorted) {
    const hex = formatHex({
      mode: 'rgb',
      r: e.r / e.n / 255,
      g: e.g / e.n / 255,
      b: e.b / e.n / 255,
    })
    if (!hex) continue
    // Drop near-duplicates so the palette of suggestions stays distinct.
    if (hexes.every(h => deltaE(h, hex) > 8)) hexes.push(hex)
    if (hexes.length >= count) break
  }
  return hexes
}
