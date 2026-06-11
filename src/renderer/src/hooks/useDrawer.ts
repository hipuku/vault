import { useState, useCallback } from 'react'

export function useDrawer<T>(): {
  open: boolean
  item: T | null
  openDrawer: (item: T) => void
  closeDrawer: () => void
} {
  const [item, setItem] = useState<T | null>(null)

  const openDrawer = useCallback((next: T): void => setItem(next), [])
  const closeDrawer = useCallback((): void => setItem(null), [])

  return { open: item !== null, item, openDrawer, closeDrawer }
}
