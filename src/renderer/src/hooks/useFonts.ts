import { useState, useEffect, useCallback } from 'react'
import type { Font, GoogleFontMeta } from '@shared/types'
import { ensureFontLoaded } from '../lib/fontLoader'

export function useFonts(): {
  fonts: Font[]
  addGoogle: (meta: GoogleFontMeta) => Promise<Font>
  addLocal: (family: string, category: string, path: string) => Promise<Font>
  setFavourite: (id: number, favourite: 0 | 1) => Promise<void>
  removeFont: (id: number) => Promise<void>
  refresh: () => Promise<void>
} {
  const [fonts, setFonts] = useState<Font[]>([])

  const refresh = useCallback(async (): Promise<void> => {
    const list = await window.api.font.list()
    setFonts(list)
    list.forEach(f => { void ensureFontLoaded(f) })
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const addGoogle = useCallback(async (meta: GoogleFontMeta): Promise<Font> => {
    const f = await window.api.font.addGoogle(meta.family, meta.category, JSON.stringify(meta.weights))
    await ensureFontLoaded(f)
    setFonts(prev => [f, ...prev])
    return f
  }, [])

  const addLocal = useCallback(async (family: string, category: string, path: string): Promise<Font> => {
    const f = await window.api.font.addLocal(family, category, path)
    await ensureFontLoaded(f)
    setFonts(prev => [f, ...prev])
    return f
  }, [])

  const setFavourite = useCallback(async (id: number, favourite: 0 | 1): Promise<void> => {
    await window.api.font.updateFavourite(id, favourite)
    setFonts(prev => prev.map(f => (f.id === id ? { ...f, favourite } : f)))
  }, [])

  const removeFont = useCallback(async (id: number): Promise<void> => {
    await window.api.font.delete(id)
    setFonts(prev => prev.filter(f => f.id !== id))
  }, [])

  return { fonts, addGoogle, addLocal, setFavourite, removeFont, refresh }
}
