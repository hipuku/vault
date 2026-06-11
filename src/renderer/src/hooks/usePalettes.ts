import { useState, useEffect, useCallback } from 'react'
import type { Palette, Swatch, Tag } from '@shared/types'

interface PaletteData {
  palettes: Palette[]
  swatchesByPalette: Record<number, Swatch[]>
  tagsByPalette: Record<number, Tag[]>
}

export function usePalettes(): PaletteData & {
  createFromHex: (name: string, baseHex: string, swatches: string[]) => Promise<Palette>
  createFromLibrary: (name: string, hexList: string[]) => Promise<Palette>
  duplicate: (id: number) => Promise<void>
  setFavourite: (id: number, favourite: 0 | 1) => Promise<void>
  remove: (id: number) => Promise<void>
  updateSwatchLabel: (paletteId: number, swatchId: number, label: string) => Promise<void>
  refresh: () => Promise<void>
} {
  const [palettes, setPalettes] = useState<Palette[]>([])
  const [swatchesByPalette, setSwatches] = useState<Record<number, Swatch[]>>({})
  const [tagsByPalette, setTags] = useState<Record<number, Tag[]>>({})

  const refresh = useCallback(async (): Promise<void> => {
    const list = await window.api.palette.list()
    setPalettes(list)
    const [sw, tg] = await Promise.all([
      Promise.all(list.map(async p => [p.id, await window.api.swatch.list(p.id)] as const)),
      Promise.all(list.map(async p => [p.id, await window.api.tag.listForAsset('palette', p.id)] as const)),
    ])
    setSwatches(Object.fromEntries(sw))
    setTags(Object.fromEntries(tg))
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const createFromHex = useCallback(async (name: string, baseHex: string, swatches: string[]): Promise<Palette> => {
    const p = await window.api.palette.createFromHex(name, baseHex, swatches)
    await refresh()
    return p
  }, [refresh])

  const createFromLibrary = useCallback(async (name: string, hexList: string[]): Promise<Palette> => {
    const p = await window.api.palette.createFromLibrary(name, hexList)
    await refresh()
    return p
  }, [refresh])

  const duplicate = useCallback(async (id: number): Promise<void> => {
    await window.api.palette.duplicate(id)
    await refresh()
  }, [refresh])

  const setFavourite = useCallback(async (id: number, favourite: 0 | 1): Promise<void> => {
    await window.api.palette.updateFavourite(id, favourite)
    setPalettes(prev => prev.map(p => (p.id === id ? { ...p, favourite } : p)))
  }, [])

  const remove = useCallback(async (id: number): Promise<void> => {
    await window.api.palette.delete(id)
    setPalettes(prev => prev.filter(p => p.id !== id))
  }, [])

  const updateSwatchLabel = useCallback(async (paletteId: number, swatchId: number, label: string): Promise<void> => {
    await window.api.swatch.updateLabel(swatchId, label)
    setSwatches(prev => ({
      ...prev,
      [paletteId]: (prev[paletteId] ?? []).map(s => (s.id === swatchId ? { ...s, label } : s)),
    }))
  }, [])

  return {
    palettes, swatchesByPalette, tagsByPalette,
    createFromHex, createFromLibrary, duplicate, setFavourite, remove, updateSwatchLabel, refresh,
  }
}
