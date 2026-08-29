import { useCallback, useState } from 'react'

export interface LoadState {
  /** The reason the last load failed, or null. */
  loadError: string | null
  /** Wrap a list fetch so a failure is recorded instead of vanishing. */
  guard: <T>(load: () => Promise<T>, onOk: (value: T) => void) => Promise<void>
}

/**
 * A failed list load used to leave the page showing its empty state, so a locked or
 * unreadable database was indistinguishable from a library with nothing in it. The
 * pages read `loadError` and say so instead.
 */
export function useLoadState(): LoadState {
  const [loadError, setLoadError] = useState<string | null>(null)

  const guard = useCallback(async <T,>(load: () => Promise<T>, onOk: (value: T) => void): Promise<void> => {
    try {
      onOk(await load())
      setLoadError(null)
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : String(e))
    }
  }, [])

  return { loadError, guard }
}
