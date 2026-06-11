import React, { useState, useEffect, useMemo } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus } from '@fortawesome/free-solid-svg-icons'
import type { Palette } from '@shared/types'
import { Toolbar } from '../primitives/Toolbar/Toolbar'
import { EmptyState } from '../primitives/EmptyState/EmptyState'
import { SectionGrid } from '../primitives/SectionGrid/SectionGrid'
import { ConfirmDialog } from '../primitives/ConfirmDialog/ConfirmDialog'
import { Button } from '../atoms/Button/Button'
import { FavouriteToggle } from '../domain/FavouriteToggle/FavouriteToggle'
import { PaletteCard } from '../domain/PaletteCard/PaletteCard'
import { PaletteDrawer } from '../domain/PaletteDrawer/PaletteDrawer'
import { PaletteModal } from '../domain/PaletteModal/PaletteModal'
import { TagGroup } from '../domain/TagGroup/TagGroup'
import { usePalettes } from '../hooks/usePalettes'
import { useDrawer } from '../hooks/useDrawer'
import { useConfirm } from '../hooks/useConfirm'

interface PalettesPageProps {
  activeTagId: number | null
  embedded?: { title: string }
}

export function PalettesPage({ activeTagId, embedded }: PalettesPageProps): React.ReactElement | null {
  const { palettes, swatchesByPalette, tagsByPalette, createFromHex, createFromLibrary, duplicate, setFavourite, remove, updateSwatchLabel, refresh } = usePalettes()
  const [favOnly, setFavOnly] = useState(false)
  const [tagIds, setTagIds] = useState<Set<number> | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const drawer = useDrawer<Palette>()
  const confirm = useConfirm()

  useEffect(() => {
    if (activeTagId == null) { setTagIds(null); return }
    let live = true
    window.api.tag.listAssetIds('palette', activeTagId).then(ids => { if (live) setTagIds(new Set(ids)) })
    return () => { live = false }
  }, [activeTagId, drawer.open])

  const filtered = useMemo(
    () => palettes.filter(p => {
      if (favOnly && !p.favourite) return false
      if (tagIds && !tagIds.has(p.id)) return false
      return true
    }),
    [palettes, favOnly, tagIds]
  )

  async function handleDelete(palette: Palette): Promise<void> {
    const ok = await confirm.confirm({
      title: `Delete "${palette.name}"?`,
      message: 'This palette and its swatches will be removed. This can’t be undone.',
      confirmLabel: 'Delete palette',
    })
    if (ok) {
      await remove(palette.id)
      drawer.closeDrawer()
    }
  }

  const drawerPalette = drawer.item ? palettes.find(p => p.id === drawer.item!.id) ?? null : null

  const grid = (
    <SectionGrid>
      {filtered.map(palette => (
        <PaletteCard
          key={palette.id}
          palette={palette}
          swatches={swatchesByPalette[palette.id] ?? []}
          tags={tagsByPalette[palette.id] ?? []}
          onOpen={drawer.openDrawer}
          onDuplicate={duplicate}
          onDelete={handleDelete}
          onToggleFavourite={setFavourite}
        />
      ))}
    </SectionGrid>
  )

  const overlays = (
    <>
      <PaletteDrawer
        palette={drawerPalette}
        swatches={drawerPalette ? swatchesByPalette[drawerPalette.id] ?? [] : []}
        onClose={() => { drawer.closeDrawer(); refresh() }}
        onToggleFavourite={setFavourite}
        onDuplicate={async id => { await duplicate(id) }}
        onDelete={handleDelete}
        onLabelChange={updateSwatchLabel}
      />
      <PaletteModal open={modalOpen} onClose={() => setModalOpen(false)} onCreateFromHex={createFromHex} onCreateFromLibrary={createFromLibrary} />
      <ConfirmDialog
        open={confirm.isOpen}
        title={confirm.title}
        message={confirm.message}
        confirmLabel={confirm.confirmLabel}
        onConfirm={confirm.onConfirm}
        onCancel={confirm.onCancel}
      />
    </>
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

  return (
    <>
      <Toolbar
        title="Palettes"
        actions={
          <>
            <Button variant="primary" size="md" onClick={() => setModalOpen(true)}>
              <FontAwesomeIcon icon={faPlus} />
              New palette
            </Button>
            <FavouriteToggle active={favOnly} onToggle={() => setFavOnly(v => !v)} />
          </>
        }
      />
      <div className="scroll-area">
        {palettes.length === 0 ? (
          <EmptyState
            title="Build a palette from a hex or your colour library"
            description="Generate a 10-step perceptual scale, or compose swatches from saved colours."
            action={<Button variant="primary" size="md" onClick={() => setModalOpen(true)}><FontAwesomeIcon icon={faPlus} />New palette</Button>}
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No palettes match this filter"
            description={favOnly ? 'No favourites yet — star a palette to see it here.' : 'No palettes carry this tag yet.'}
          />
        ) : grid}
      </div>
      {overlays}
    </>
  )
}
