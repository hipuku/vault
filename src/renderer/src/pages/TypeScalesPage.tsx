import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus } from '@fortawesome/free-solid-svg-icons'
import type { TypeScale } from '@shared/types'
import { Toolbar } from '../molecules/Toolbar/Toolbar'
import { EmptyState } from '../molecules/EmptyState/EmptyState'
import { SectionGrid } from '../molecules/SectionGrid/SectionGrid'
import { ConfirmDialog } from '../molecules/ConfirmDialog/ConfirmDialog'
import { Button } from '../atoms/Button/Button'
import { TypeScaleCard } from '../organisms/TypeScaleCard/TypeScaleCard'
import { TypeScaleCreate } from '../organisms/TypeScaleCreate/TypeScaleCreate'
import { TypeScaleView } from '../organisms/TypeScaleView/TypeScaleView'
import { TagGroup } from '../molecules/TagGroup/TagGroup'
import { useTypeScales } from '../hooks/useTypeScales'
import { useFonts } from '../hooks/useFonts'
import { useConfirm } from '../hooks/useConfirm'
import { fontStackById, fontFamilyById } from '../lib/fontLoader'

interface TypeScalesPageProps {
  activeTagId: number | null
  embedded?: { title: string }
  openCreate?: boolean
  onCreateConsumed?: () => void
}

export function TypeScalesPage({ activeTagId, embedded, openCreate: openCreateSignal, onCreateConsumed }: TypeScalesPageProps): React.ReactElement | null {
  const { scales, stepsByScale, create, rename, remove, refresh, loadError } = useTypeScales()
  const { fonts } = useFonts()
  const [tagIds, setTagIds] = useState<Set<number> | null>(null)
  const [view, setView] = useState<'list' | 'create' | 'view'>('list')
  const [viewId, setViewId] = useState<number | null>(null)
  const confirm = useConfirm()

  const openCreate = useCallback((): void => setView('create'), [])
  const openView = useCallback((s: TypeScale): void => { setViewId(s.id); setView('view') }, [])
  const backToList = useCallback((): void => { setView('list'); setViewId(null); refresh() }, [refresh])

  // Opened from the command palette (⌘K → "New type scale").
  useEffect(() => {
    if (openCreateSignal) { openCreate(); onCreateConsumed?.() }
  }, [openCreateSignal, onCreateConsumed, openCreate])

  useEffect(() => {
    if (activeTagId == null) { setTagIds(null); return }
    let live = true
    window.api.tag.listAssetIds('type_scale', activeTagId).then(ids => { if (live) setTagIds(new Set(ids)) })
    return () => { live = false }
  }, [activeTagId, view])

  const filtered = useMemo(
    () => scales.filter(s => {
      if (tagIds && !tagIds.has(s.id)) return false
      return true
    }),
    [scales, tagIds]
  )

  async function handleDelete(scale: TypeScale): Promise<void> {
    const ok = await confirm.confirm({
      title: `Delete "${scale.name}"?`,
      message: 'This type scale will be removed. This can’t be undone.',
      confirmLabel: 'Delete type scale',
    })
    if (ok) {
      await remove(scale.id)
      setView('list'); setViewId(null)
    }
  }

  const grid = (
    <SectionGrid>
      {filtered.map(scale => (
        <TypeScaleCard
          key={scale.id}
          scale={scale}
          steps={stepsByScale[scale.id] ?? []}
          headingStack={fontStackById(scale.heading_font_id, fonts)}
          bodyStack={fontStackById(scale.body_font_id ?? scale.heading_font_id, fonts)}
          onOpen={openView}
        />
      ))}
    </SectionGrid>
  )

  const overlays = (
    <ConfirmDialog
      open={confirm.isOpen}
      title={confirm.title}
      message={confirm.message}
      confirmLabel={confirm.confirmLabel}
      onConfirm={confirm.onConfirm}
      onCancel={confirm.onCancel}
    />
  )

  if (embedded) {
    if (filtered.length === 0) return null
    return (
      <>
        <TagGroup title={embedded.title} count={filtered.length}>{grid}</TagGroup>
        {overlays}
      </>
    )
  }

  if (view === 'create') {
    return (
      <TypeScaleCreate
        fonts={fonts}
        onCancel={backToList}
        onCreate={(name, headingFontId, bodyFontId, baseSize, ratio, steps) =>
          create(name, headingFontId, bodyFontId, baseSize, ratio, steps)}
      />
    )
  }

  if (view === 'view') {
    const s = scales.find(x => x.id === viewId)
    if (s) {
      return (
        <>
          <TypeScaleView
            scale={s}
            steps={stepsByScale[s.id] ?? []}
            headingStack={fontStackById(s.heading_font_id, fonts)}
            bodyStack={fontStackById(s.body_font_id ?? s.heading_font_id, fonts)}
            headingFamily={fontFamilyById(s.heading_font_id, fonts)}
            bodyFamily={fontFamilyById(s.body_font_id ?? s.heading_font_id, fonts)}
            onBack={backToList}
            onRename={rename}
            onDelete={handleDelete}
          />
          {overlays}
        </>
      )
    }
    // scale no longer exists (e.g. deleted) — fall back to the list
  }

  return (
    <>
      <Toolbar
        title="Type Scales"
        actions={
          <Button variant="primary" size="md" onClick={openCreate}>
            <FontAwesomeIcon icon={faPlus} />
            New type scale
          </Button>
        }
      />
      <div className="scroll-area">
        {loadError ? (
          <EmptyState
            title="Couldn’t open your library"
            description={loadError}
          />
        ) : scales.length === 0 ? (
          <EmptyState
            title="Pick a font from your library to start"
            description="Generate a Product or Web/Markup scale with a ratio preset, then fine-tune each step."
            action={<Button variant="primary" size="md" onClick={openCreate}><FontAwesomeIcon icon={faPlus} />New type scale</Button>}
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No type scales match this filter"
            description="No scales in this project yet."
          />
        ) : grid}
      </div>
      {overlays}
    </>
  )
}
