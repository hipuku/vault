import { useState, useCallback } from 'react'

export function useCopy(): { copy: (text: string) => void; copied: boolean } {
  const [copied, setCopied] = useState(false)

  const copy = useCallback((text: string): void => {
    window.api.clipboard.write(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1200)
  }, [])

  return { copy, copied }
}
