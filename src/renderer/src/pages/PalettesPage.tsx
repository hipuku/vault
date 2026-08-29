import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus } from '@fortawesome/free-solid-svg-icons'
import type { Colour, Palette } from '@shared/types'
import { Toolbar } from '../molecules/Toolbar/Toolbar'
import { EmptyState } from '../molecules/EmptyState/EmptyState'
import { SectionGrid } from '../molecules/SectionGrid/SectionGrid'
import { ConfirmDialog } from '../molecules/ConfirmDialog/ConfirmDialog'
import { Button } from '../atoms/Button/Button'
import { PaletteCard } from '../organisms/PaletteCard/PaletteCard'
import { PaletteCreate } from '../organisms/PaletteCreate/PaletteCreate'
import { PaletteView } from '../organisms/PaletteView/PaletteView'
import { TagGroup } from '../molecules/TagGroup/TagGroup'
import { usePalettes } from '../hooks/usePalettes'
import { useConfirm } from '../hooks/useConfirm'

interface PalettesPageProps {
  activeTagId: number | null
  embedded?: { title: string }
  openCreate?: boolean
  onCreateConsumed?: () => void
}

export function PalettesPage({ activeTagId, embedded, openCreate: openCreateSignal, onCreateConsumed }: PalettesPageProps): React.ReactElement | null {
  const {
    palettes, swatchesByPalette,
    createTonal, createExpressive,
    rename, remove, promoteSwatch, refresh, loadError } = usePalettes()

  const [tagIds, setTagIds] = useState<Set<number> | null>(null)
  const [view, setView] = useState<'list' | 'create' | 'view'>('list')
  const [viewId, setViewId] = useState<number | null>(null)
  const [library, setLibrary] = useState<Colour[]>([])
  const confirm = useConfirm()

  useEffect(() => { window.api.colour.list().then(setLibrary) }, [])

  const openCreate = useCallback((): void => {
    window.api.colour.list().then(setLibrary)
    setView('create')
  }, [])

  const openView = useCallback((p: Palette): void => { setViewId(p.id); setView('view') }, [])
  const backToList = useCallback((): void => { setView('list'); setViewId(null); refresh() }, [refresh])

  // Opened from the command palette (⌘K → "New palette").
  useEffect(() => {
    if (openCreateSignal) { openCreate(); onCreateConsumed?.() }
  }, [openCreateSignal, onCreateConsumed, openCreate])

  useEffect(() => {
    if (activeTagId == null) { setTagIds(null); return }
    let live = true
    window.api.tag.listAssetIds('palette', activeTagId).then(ids => { if (live) setTagIds(new Set(ids)) })
    return () => { live = false }
  }, [activeTagId, view])

  const filtered = useMemo(
    () => palettes.filter(p => {
      if (tagIds && !tagIds.has(p.id)) return false
      return true
    }),
    [palettes, tagIds]
  )

  async function handleDelete(palette: Palette): Promise<void> {
    const ok = await confirm.confirm({
      title: `Delete "${palette.name}"?`,
      message: 'This palette and its swatches will be removed. This cannot be undone.',
      confirmLabel: 'Delete palette',
    })
    if (ok) {
      await remove(palette.id)
      setView('list'); setViewId(null)
    }
  }

  const handlePromote = useCallback(async (paletteId: number, swatchId: number, name: string): Promise<unknown> => {
    return promoteSwatch(paletteId, swatchId, name, () => { window.api.colour.list().then(setLibrary) })
  }, [promoteSwatch])

  const grid = (
    <SectionGrid>
      {filtered.map(palette => (
        <PaletteCard
          key={palette.id}
          palette={palette}
          swatches={swatchesByPalette[palette.id] ?? []}
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
      <PaletteCreate
        library={library}
        onCancel={backToList}
        onCreateTonal={createTonal}
        onCreateExpressive={createExpressive}
      />
    )
  }

  if (view === 'view') {
    const p = palettes.find(x => x.id === viewId)
    if (p) {
      return (
        <>
          <PaletteView
            palette={p}
            swatches={swatchesByPalette[p.id] ?? []}
            onBack={backToList}
            onRename={rename}
            onDelete={handleDelete}
            onPromote={handlePromote}
          />
          {overlays}
        </>
      )
    }
    // palette no longer exists (e.g. deleted) — fall back to the list
  }

  return (
    <>
      <Toolbar
        title="Palettes"
        actions={
          <Button variant="primary" size="md" onClick={openCreate}>
            <FontAwesomeIcon icon={faPlus} />
            New palette
          </Button>
        }
      />
      <div className="scroll-area">
        {loadError ? (
          <EmptyState
            title="Couldn’t open your library"
            description={loadError}
          />
        ) : palettes.length === 0 ? (
          <EmptyState
            title="Build a tonal system or expressive set"
            description="Generate a 10-step perceptual ramp, or compose multi-hue palettes from your library colours."
            action={<Button variant="primary" size="md" onClick={openCreate}><FontAwesomeIcon icon={faPlus} />New palette</Button>}
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No palettes match this filter"
            description="No palettes in this project yet."
          />
        ) : grid}
      </div>
      {overlays}
    </>
  )
}
