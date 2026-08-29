import { useState, useEffect, useCallback } from 'react'
import { useLoadState } from './useLoadState'
import type { Colour, Palette, RampName, FillStrategy, Swatch, Tag } from '@shared/types'

interface PaletteData {
  palettes: Palette[]
  swatchesByPalette: Record<number, Swatch[]>
  tagsByPalette: Record<number, Tag[]>
}

export function usePalettes(): PaletteData & {
  createTonal: (name: string, seedHex: string, seedColourId: number | null, ramps: RampName[]) => Promise<Palette>
  createExpressive: (name: string, seeds: Array<{ hex: string; colourId: number | null }>, targetCount: number, strategy: FillStrategy) => Promise<Palette>
  rename: (id: number, name: string) => Promise<void>
  remove: (id: number) => Promise<void>
  promoteSwatch: (paletteId: number, swatchId: number, name: string, onColoursRefresh?: () => void) => Promise<Colour>
  refresh: () => Promise<void>
  loadError: string | null} {
  const { loadError, guard } = useLoadState()
  const [palettes, setPalettes] = useState<Palette[]>([])
  const [swatchesByPalette, setSwatches] = useState<Record<number, Swatch[]>>({})
  const [tagsByPalette, setTags] = useState<Record<number, Tag[]>>({})

  const refresh = useCallback(async (): Promise<void> => {
    await guard(
      async () => {
        const list = await window.api.palette.list()
        const [sw, tg] = await Promise.all([
          Promise.all(list.map(async p => [p.id, await window.api.swatch.list(p.id)] as const)),
          Promise.all(list.map(async p => [p.id, await window.api.tag.listForAsset('palette', p.id)] as const)),
        ])
        return { list, sw, tg }
      },
      ({ list, sw, tg }) => {
        setPalettes(list)
        setSwatches(Object.fromEntries(sw))
        setTags(Object.fromEntries(tg))
      },
    )
  }, [guard])

  useEffect(() => { refresh() }, [refresh])

  const createTonal = useCallback(async (name: string, seedHex: string, seedColourId: number | null, ramps: RampName[]): Promise<Palette> => {
    const p = await window.api.palette.createTonal(name, seedHex, seedColourId, ramps)
    await refresh()
    return p
  }, [refresh])

  const createExpressive = useCallback(async (name: string, seeds: Array<{ hex: string; colourId: number | null }>, targetCount: number, strategy: FillStrategy): Promise<Palette> => {
    const p = await window.api.palette.createExpressive(name, seeds, targetCount, strategy)
    await refresh()
    return p
  }, [refresh])

  const rename = useCallback(async (id: number, name: string): Promise<void> => {
    await window.api.palette.updateName(id, name)
    setPalettes(prev => prev.map(p => (p.id === id ? { ...p, name } : p)))
  }, [])

  const remove = useCallback(async (id: number): Promise<void> => {
    await window.api.palette.delete(id)
    setPalettes(prev => prev.filter(p => p.id !== id))
  }, [])

  const promoteSwatch = useCallback(async (paletteId: number, swatchId: number, name: string, onColoursRefresh?: () => void): Promise<Colour> => {
    const colour = await window.api.swatch.promote(swatchId, name)
    setSwatches(prev => ({
      ...prev,
      [paletteId]: (prev[paletteId] ?? []).map(s => (s.id === swatchId ? { ...s, colour_id: colour.id } : s)),
    }))
    onColoursRefresh?.()
    return colour
  }, [])

  return {
    palettes, swatchesByPalette, tagsByPalette,
    createTonal, createExpressive, rename, remove, promoteSwatch, refresh, loadError,
  }
}
