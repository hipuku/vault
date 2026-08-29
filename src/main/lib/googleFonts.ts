import type { GoogleFontMeta } from '../../shared/types'

// Per DECISIONS: hit the metadata endpoint directly, strip the )]}' prefix,
// cache at module level for the session. No third-party wrapper.
let cache: GoogleFontMeta[] | null = null

interface RawFamily {
  family: string
  category: string
  fonts?: Record<string, unknown>
  popularity?: number
}

export async function getGoogleFonts(): Promise<GoogleFontMeta[]> {
  if (cache) return cache

  const res = await fetch('https://fonts.google.com/metadata/fonts', {
    signal: AbortSignal.timeout(15_000),
  })
  // Without these, a 429 or an outage arrived as a JSON parse error, and the user was
  // told the catalogue was empty.
  if (!res.ok) {
    throw new Error(`Google Fonts is not responding (${res.status}). Try again shortly.`)
  }
  const text = await res.text()
  let json: { familyMetadataList?: RawFamily[] }
  try {
    json = JSON.parse(text.replace(/^\)\]\}'\n?/, ''))
  } catch {
    throw new Error('Google Fonts returned something unreadable.')
  }
  const list = json.familyMetadataList ?? []

  cache = list.map(f => {
    const weights = [...new Set(Object.keys(f.fonts ?? {}).map(k => k.replace(/i$/, '')))]
      .filter(w => /^\d+$/.test(w))
      .sort((a, b) => Number(a) - Number(b))
    return {
      family: f.family,
      category: f.category,
      weights: weights.length ? weights : ['400'],
      popularity: f.popularity ?? 99999,
    }
  })
  return cache
}
