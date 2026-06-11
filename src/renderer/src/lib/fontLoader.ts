import type { Font } from '@shared/types'

// Tracks what's already been injected/registered so we never double-load.
const loaded = new Set<string>()

export function parseWeights(json: string): string[] {
  try {
    const w = JSON.parse(json)
    return Array.isArray(w) && w.length ? w.map(String) : ['400']
  } catch {
    return ['400']
  }
}

/** Map a Google category to a CSS generic fallback. */
export function categoryGeneric(category: string): string {
  const c = category.toLowerCase()
  if (c.includes('serif') && !c.includes('sans')) return 'serif'
  if (c.includes('mono')) return 'monospace'
  if (c.includes('hand') || c.includes('display')) return 'cursive'
  return 'sans-serif'
}

export function googleCssUrl(family: string, weights: string[] = ['400']): string {
  const fam = family.trim().replace(/\s+/g, '+')
  const wght = [...new Set(weights)].sort((a, b) => Number(a) - Number(b)).join(';')
  return `https://fonts.googleapis.com/css2?family=${fam}:wght@${wght}&display=swap`
}

export function loadGoogleFont(family: string, weights: string[] = ['400']): void {
  const key = `g:${family}:${weights.join(',')}`
  if (loaded.has(key)) return
  loaded.add(key)
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = googleCssUrl(family, weights)
  document.head.appendChild(link)
}

export async function loadLocalFont(family: string, bytes: Uint8Array): Promise<boolean> {
  const key = `l:${family}`
  if (loaded.has(key)) return true
  try {
    const face = new FontFace(family, bytes as BufferSource)
    await face.load()
    document.fonts.add(face)
    loaded.add(key)
    return true
  } catch {
    return false // unreadable/invalid font file — card falls back
  }
}

// Load a dropped font under a throwaway family for previewing during the add
// flow — decoupled from the (editable) name that will actually be saved.
let previewCounter = 0
export async function loadPreviewFont(bytes: Uint8Array): Promise<string | null> {
  const family = `__vault_preview_${++previewCounter}`
  try {
    const face = new FontFace(family, bytes as BufferSource)
    await face.load()
    document.fonts.add(face)
    return family
  } catch {
    return null
  }
}

/** Best-effort family name from a font filename (strips extension + style words). */
export function familyFromFilename(filename: string): string {
  const base = filename.replace(/\.(ttf|otf|woff2?|woff)$/i, '')
  const cleaned = base
    .replace(/[-_]+/g, ' ')
    .replace(/\b(thin|extralight|ultralight|light|regular|normal|book|medium|semibold|demibold|bold|extrabold|ultrabold|black|heavy|italic|oblique|variable|vf)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
  return cleaned || base
}

/** Ensure a saved font is available for rendering (Google link or local FontFace). */
export async function ensureFontLoaded(font: Font): Promise<void> {
  if (font.source === 'google') {
    loadGoogleFont(font.family, parseWeights(font.weights))
  } else if (font.source_url) {
    try {
      const bytes = await window.api.font.readFile(font.source_url)
      await loadLocalFont(font.family, bytes)
    } catch {
      /* file moved or deleted — handled as a missing-font state in the UI */
    }
  }
}
