import { useState, useEffect, useCallback } from 'react'
import { useLoadState } from './useLoadState'
import type { Colour } from '@shared/types'

export function useColours(): {
  colours: Colour[]
  addColour: (hex: string, name: string) => Promise<Colour>
  renameColour: (id: number, name: string) => Promise<void>
  setFavourite: (id: number, favourite: 0 | 1) => Promise<void>
  removeColour: (id: number) => Promise<void>
  refresh: () => Promise<void>
  loadError: string | null
} {
  const { loadError, guard } = useLoadState()
  const [colours, setColours] = useState<Colour[]>([])

  const refresh = useCallback(async (): Promise<void> => {
    await guard(() => window.api.colour.list(), setColours)
  }, [guard])

  useEffect(() => { refresh() }, [refresh])

  const addColour = useCallback(async (hex: string, name: string): Promise<Colour> => {
    const c = await window.api.colour.create(hex, name)
    setColours(prev => [c, ...prev])
    return c
  }, [])

  const renameColour = useCallback(async (id: number, name: string): Promise<void> => {
    await window.api.colour.updateName(id, name)
    setColours(prev => prev.map(c => (c.id === id ? { ...c, name } : c)))
  }, [])

  const setFavourite = useCallback(async (id: number, favourite: 0 | 1): Promise<void> => {
    await window.api.colour.updateFavourite(id, favourite)
    setColours(prev => prev.map(c => (c.id === id ? { ...c, favourite } : c)))
  }, [])

  const removeColour = useCallback(async (id: number): Promise<void> => {
    await window.api.colour.delete(id)
    setColours(prev => prev.filter(c => c.id !== id))
  }, [])

  return { colours, addColour, renameColour, setFavourite, removeColour, refresh, loadError }
}
