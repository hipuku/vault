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

  const res = await fetch('https://fonts.google.com/metadata/fonts')
  const text = await res.text()
  const json = JSON.parse(text.replace(/^\)\]\}'\n?/, '')) as { familyMetadataList?: RawFamily[] }
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
