import { useState, useEffect, useCallback } from 'react'
import type { TypeScale, TypeScaleStep, TypeScaleStepInput } from '@shared/types'

export function useTypeScales(): {
  scales: TypeScale[]
  stepsByScale: Record<number, TypeScaleStep[]>
  create: (name: string, headingFontId: number | null, bodyFontId: number | null, baseSize: number, ratio: string, steps: TypeScaleStepInput[]) => Promise<TypeScale>
  setFavourite: (id: number, favourite: 0 | 1) => Promise<void>
  remove: (id: number) => Promise<void>
  updateStep: (scaleId: number, stepId: number, size: number, weight: number, lineHeight: string, letterSpacing: string) => Promise<void>
  refresh: () => Promise<void>
} {
  const [scales, setScales] = useState<TypeScale[]>([])
  const [stepsByScale, setStepsByScale] = useState<Record<number, TypeScaleStep[]>>({})

  const refresh = useCallback(async (): Promise<void> => {
    const list = await window.api.typeScale.list()
    setScales(list)
    const entries = await Promise.all(
      list.map(async s => [s.id, await window.api.typeScaleStep.list(s.id)] as const)
    )
    setStepsByScale(Object.fromEntries(entries))
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const create = useCallback(async (name: string, headingFontId: number | null, bodyFontId: number | null, baseSize: number, ratio: string, steps: TypeScaleStepInput[]): Promise<TypeScale> => {
    const ts = await window.api.typeScale.create(name, headingFontId, bodyFontId, baseSize, ratio, steps)
    await refresh()
    return ts
  }, [refresh])

  const setFavourite = useCallback(async (id: number, favourite: 0 | 1): Promise<void> => {
    await window.api.typeScale.updateFavourite(id, favourite)
    setScales(prev => prev.map(s => (s.id === id ? { ...s, favourite } : s)))
  }, [])

  const remove = useCallback(async (id: number): Promise<void> => {
    await window.api.typeScale.delete(id)
    setScales(prev => prev.filter(s => s.id !== id))
  }, [])

  const updateStep = useCallback(async (scaleId: number, stepId: number, size: number, weight: number, lineHeight: string, letterSpacing: string): Promise<void> => {
    await window.api.typeScaleStep.update(stepId, size, weight, lineHeight, letterSpacing)
    setStepsByScale(prev => ({
      ...prev,
      [scaleId]: (prev[scaleId] ?? []).map(s => (s.id === stepId ? { ...s, size, weight, line_height: lineHeight, letter_spacing: letterSpacing } : s)),
    }))
  }, [])

  return { scales, stepsByScale, create, setFavourite, remove, updateStep, refresh }
}
