import { useState, useEffect, useCallback } from 'react'
import type { TagWithCount } from '@shared/types'

function bySortLabel(a: TagWithCount, b: TagWithCount): number {
  return a.label.localeCompare(b.label)
}

export function useTags(): {
  tags: TagWithCount[]
  createTag: (label: string, colour: string) => Promise<TagWithCount>
  updateTag: (id: number, label: string, colour: string) => Promise<void>
  deleteTag: (id: number) => Promise<void>
  refresh: () => Promise<void>
} {
  const [tags, setTags] = useState<TagWithCount[]>([])

  const refresh = useCallback(async (): Promise<void> => {
    setTags(await window.api.tag.list())
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  // Create/update may reject on the UNIQUE(label) constraint, so callers catch
  // the rejection to show inline "tag already exists" feedback.
  const createTag = useCallback(async (label: string, colour: string): Promise<TagWithCount> => {
    const tag = await window.api.tag.create(label, colour)
    setTags(prev => [...prev, tag].sort(bySortLabel))
    return tag
  }, [])

  const updateTag = useCallback(async (id: number, label: string, colour: string): Promise<void> => {
    await window.api.tag.update(id, label, colour)
    setTags(prev => prev.map(t => (t.id === id ? { ...t, label, colour } : t)).sort(bySortLabel))
  }, [])

  const deleteTag = useCallback(async (id: number): Promise<void> => {
    await window.api.tag.delete(id)
    setTags(prev => prev.filter(t => t.id !== id))
  }, [])

  return { tags, createTag, updateTag, deleteTag, refresh }
}
