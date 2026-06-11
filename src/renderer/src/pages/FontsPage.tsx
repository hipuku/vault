import React, { useState, useEffect, useMemo } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus } from '@fortawesome/free-solid-svg-icons'
import type { Font } from '@shared/types'
import { Toolbar } from '../primitives/Toolbar/Toolbar'
import { EmptyState } from '../primitives/EmptyState/EmptyState'
import { SectionGrid } from '../primitives/SectionGrid/SectionGrid'
import { ConfirmDialog } from '../primitives/ConfirmDialog/ConfirmDialog'
import { Button } from '../atoms/Button/Button'
import { FavouriteToggle } from '../domain/FavouriteToggle/FavouriteToggle'
import { FontPreviewBar } from '../domain/FontPreviewBar/FontPreviewBar'
import { FontCard } from '../domain/FontCard/FontCard'
import { FontDrawer } from '../domain/FontDrawer/FontDrawer'
import { FontAdder } from '../domain/FontAdder/FontAdder'
import { TagGroup } from '../domain/TagGroup/TagGroup'
import { useFonts } from '../hooks/useFonts'
import { useDrawer } from '../hooks/useDrawer'
import { useConfirm } from '../hooks/useConfirm'

const DEFAULT_PREVIEW = 'The quick brown fox jumps over the lazy dog'

interface FontsPageProps {
  activeTagId: number | null
  embedded?: { title: string }
}

export function FontsPage({ activeTagId, embedded }: FontsPageProps): React.ReactElement | null {
  const { fonts, addGoogle, addLocal, setFavourite, removeFont } = useFonts()
  const [previewText, setPreviewText] = useState(DEFAULT_PREVIEW)
  const [previewSize, setPreviewSize] = useState(28)
  const [favOnly, setFavOnly] = useState(false)
  const [tagIds, setTagIds] = useState<Set<number> | null>(null)
  const [adderOpen, setAdderOpen] = useState(false)
  const drawer = useDrawer<Font>()
  const confirm = useConfirm()

  useEffect(() => {
    if (activeTagId == null) { setTagIds(null); return }
    let live = true
    window.api.tag.listAssetIds('font', activeTagId).then(ids => { if (live) setTagIds(new Set(ids)) })
    return () => { live = false }
  }, [activeTagId, drawer.open])

  const filtered = useMemo(
    () => fonts.filter(f => {
      if (favOnly && !f.favourite) return false
      if (tagIds && !tagIds.has(f.id)) return false
      return true
    }),
    [fonts, favOnly, tagIds]
  )

  const existingFamilies = useMemo(() => new Set(fonts.map(f => f.family)), [fonts])

  async function handleDelete(font: Font): Promise<void> {
    const ok = await confirm.confirm({
      title: `Remove "${font.family}"?`,
      message: 'This font will be removed from your library. This can’t be undone.',
      confirmLabel: 'Remove font',
    })
    if (ok) {
      await removeFont(font.id)
      drawer.closeDrawer()
    }
  }

  const drawerFont = drawer.item ? fonts.find(f => f.id === drawer.item!.id) ?? null : null

  const grid = (
    <SectionGrid>
      {filtered.map(font => (
        <FontCard
          key={font.id}
          font={font}
          previewText={previewText}
          previewSize={previewSize}
          onOpen={drawer.openDrawer}
          onToggleFavourite={setFavourite}
        />
      ))}
    </SectionGrid>
  )

  const overlays = (
    <>
      <FontDrawer font={drawerFont} onClose={drawer.closeDrawer} onToggleFavourite={setFavourite} onDelete={handleDelete} />
      <FontAdder open={adderOpen} onClose={() => setAdderOpen(false)} existing={existingFamilies} onAddGoogle={addGoogle} onAddLocal={addLocal} />
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
        title="Fonts"
        actions={
          <>
            <Button variant="primary" size="md" onClick={() => setAdderOpen(true)}>
              <FontAwesomeIcon icon={faPlus} />
              Add font
            </Button>
            <FavouriteToggle active={favOnly} onToggle={() => setFavOnly(v => !v)} />
          </>
        }
      >
        <FontPreviewBar text={previewText} size={previewSize} onTextChange={setPreviewText} onSizeChange={setPreviewSize} />
      </Toolbar>

      <div className="scroll-area">
        {fonts.length === 0 ? (
          <EmptyState
            title="Add a font from Google Fonts or a local file"
            description="Preview at any size, then save it to your library."
            action={<Button variant="primary" size="md" onClick={() => setAdderOpen(true)}><FontAwesomeIcon icon={faPlus} />Add font</Button>}
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No fonts match this filter"
            description={favOnly ? 'No favourites yet — star a font to see it here.' : 'No fonts carry this tag yet.'}
          />
        ) : grid}
      </div>
      {overlays}
    </>
  )
}
