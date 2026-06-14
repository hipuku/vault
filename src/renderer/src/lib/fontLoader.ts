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

/** Human-readable category label for the card descriptor pill. */
export function categoryLabel(category: string): string {
  const c = category.toLowerCase()
  if (c === 'local') return 'Local'
  if (c.includes('sans')) return 'Sans Serif'
  if (c.includes('serif')) return 'Serif'
  if (c.includes('display')) return 'Display'
  if (c.includes('hand')) return 'Handwriting'
  if (c.includes('mono')) return 'Monospace'
  return category.charAt(0).toUpperCase() + category.slice(1)
}

/** CSS font stack (family + generic fallback) for a saved font. */
export function fontStack(font: Font | null | undefined): string {
  return font ? `'${font.family}', ${categoryGeneric(font.category)}` : 'system-ui, sans-serif'
}

/** Resolve a font id to its CSS stack within a list. */
export function fontStackById(fontId: number | null, fonts: Font[]): string {
  return fontStack(fonts.find(f => f.id === fontId))
}

/** Resolve a font id to its family name within a list (or null). */
export function fontFamilyById(fontId: number | null, fonts: Font[]): string | null {
  return fonts.find(f => f.id === fontId)?.family ?? null
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

/** Load one local file as a FontFace under `family` with explicit weight/style,
 *  so a family can carry several files (Regular, Bold, Italic, …). */
export async function loadLocalFontFace(
  family: string, bytes: Uint8Array, weight: number, style: 'normal' | 'italic',
): Promise<boolean> {
  const key = `l:${family}:${weight}:${style}`
  if (loaded.has(key)) return true
  try {
    const face = new FontFace(family, bytes as BufferSource, { weight: String(weight), style })
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

/** Guess weight (100–900) and style from a font filename. */
export function detectWeightStyle(filename: string): { weight: number; style: 'normal' | 'italic' } {
  const s = filename.toLowerCase()
  const style: 'normal' | 'italic' = /italic|oblique/.test(s) ? 'italic' : 'normal'
  const numeric = s.match(/(?:^|[^0-9])([1-9]00)(?:[^0-9]|$)/)
  if (numeric) return { weight: Number(numeric[1]), style }
  const named: Array<[RegExp, number]> = [
    [/thin|hairline/, 100],
    [/extralight|ultralight/, 200],
    [/semibold|demibold/, 600],
    [/extrabold|ultrabold/, 800],
    [/black|heavy/, 900],
    [/bold/, 700],
    [/medium/, 500],
    [/light/, 300],
    [/regular|normal|book/, 400],
  ]
  for (const [re, w] of named) if (re.test(s)) return { weight: w, style }
  return { weight: 400, style }
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

interface LocalSource { path: string; weight: number; style: 'normal' | 'italic' }

/** Parse the local file map from `source_url` (JSON), falling back to a single
 *  legacy path stored as a plain string. */
function parseLocalSources(font: Font): LocalSource[] {
  if (!font.source_url) return []
  try {
    const parsed = JSON.parse(font.source_url)
    if (Array.isArray(parsed)) return parsed as LocalSource[]
  } catch { /* legacy single-path local font */ }
  return [{ path: font.source_url, weight: 400, style: 'normal' }]
}

/** Absolute paths of a local font's stored files (for "Show in Finder"). */
export function localFontPaths(font: Font): string[] {
  return parseLocalSources(font).map(s => s.path)
}

/** Ensure a saved font is available for rendering (Google link or local FontFaces). */
export async function ensureFontLoaded(font: Font): Promise<void> {
  if (font.source === 'google') {
    loadGoogleFont(font.family, parseWeights(font.weights))
    return
  }
  for (const s of parseLocalSources(font)) {
    try {
      const bytes = await window.api.font.readFile(s.path)
      await loadLocalFontFace(font.family, bytes, s.weight, s.style)
    } catch {
      /* file moved or deleted — handled as a missing-font state in the UI */
    }
  }
}
