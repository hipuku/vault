import { useState, useEffect, useCallback } from 'react'
import { useLoadState } from './useLoadState'
import type { Font, GoogleFontMeta, LocalFontFile } from '@shared/types'
import { ensureFontLoaded } from '../lib/fontLoader'

export function useFonts(): {
  fonts: Font[]
  addGoogle: (meta: GoogleFontMeta) => Promise<Font>
  addLocal: (family: string, files: LocalFontFile[]) => Promise<Font>
  setFavourite: (id: number, favourite: 0 | 1) => Promise<void>
  removeFont: (id: number) => Promise<void>
  refresh: () => Promise<void>
  loadError: string | null} {
  const { loadError, guard } = useLoadState()
  const [fonts, setFonts] = useState<Font[]>([])

  const refresh = useCallback(async (): Promise<void> => {
    await guard(() => window.api.font.list(), list => {
      setFonts(list)
      list.forEach(f => { void ensureFontLoaded(f) })
    })
  }, [guard])

  useEffect(() => { refresh() }, [refresh])

  const addGoogle = useCallback(async (meta: GoogleFontMeta): Promise<Font> => {
    const f = await window.api.font.addGoogle(meta.family, meta.category, JSON.stringify(meta.weights))
    await ensureFontLoaded(f)
    setFonts(prev => [f, ...prev])
    return f
  }, [])

  const addLocal = useCallback(async (family: string, files: LocalFontFile[]): Promise<Font> => {
    const f = await window.api.font.addLocal(family, files)
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

  return { fonts, addGoogle, addLocal, setFavourite, removeFont, refresh, loadError }
}
