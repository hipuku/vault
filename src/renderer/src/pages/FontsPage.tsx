import React, { useState, useEffect, useMemo } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus } from '@fortawesome/free-solid-svg-icons'
import type { Font } from '@shared/types'
import { Toolbar } from '../molecules/Toolbar/Toolbar'
import { EmptyState } from '../molecules/EmptyState/EmptyState'
import { SectionGrid } from '../molecules/SectionGrid/SectionGrid'
import { ConfirmDialog } from '../molecules/ConfirmDialog/ConfirmDialog'
import { Button } from '../atoms/Button/Button'
import { FavouriteToggle } from '../molecules/FavouriteToggle/FavouriteToggle'
import { FontPreviewControl } from '../molecules/FontPreviewControl/FontPreviewControl'
import { FontCard } from '../organisms/FontCard/FontCard'
import { FontDrawer } from '../organisms/FontDrawer/FontDrawer'
import { FontAdder } from '../organisms/FontAdder/FontAdder'
import { TagGroup } from '../molecules/TagGroup/TagGroup'
import { useFonts } from '../hooks/useFonts'
import { useDrawer } from '../hooks/useDrawer'
import { useConfirm } from '../hooks/useConfirm'

const DEFAULT_PREVIEW = 'The quick brown fox jumps over the lazy dog'

interface FontsPageProps {
  activeTagId: number | null
  embedded?: { title: string }
  openCreate?: boolean
  onCreateConsumed?: () => void
  openItemId?: number | null
  onItemOpened?: () => void
}

export function FontsPage({ activeTagId, embedded, openCreate, onCreateConsumed, openItemId, onItemOpened }: FontsPageProps): React.ReactElement | null {
  const { fonts, addGoogle, addLocal, setFavourite, removeFont } = useFonts()
  const [previewText, setPreviewText] = useState(DEFAULT_PREVIEW)
  const [previewSize, setPreviewSize] = useState(20)
  const [favOnly, setFavOnly] = useState(false)
  const [tagIds, setTagIds] = useState<Set<number> | null>(null)
  const [adderOpen, setAdderOpen] = useState(false)
  const drawer = useDrawer<Font>()
  const confirm = useConfirm()

  // Opened from the command palette (⌘K → "Add font").
  useEffect(() => {
    if (openCreate) { setAdderOpen(true); onCreateConsumed?.() }
  }, [openCreate, onCreateConsumed])

  // Selected a specific font in the command palette → open its drawer.
  useEffect(() => {
    if (openItemId == null || fonts.length === 0) return
    const font = fonts.find(f => f.id === openItemId)
    if (font) drawer.openDrawer(font)
    onItemOpened?.()
  }, [openItemId, fonts, onItemOpened, drawer])

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
    const using = await window.api.font.scalesUsing(font.id)
    if (using.length > 0) {
      await confirm.confirm({
        title: `Can’t remove “${font.family}”`,
        message: `It’s used by ${using.length} type scale${using.length === 1 ? '' : 's'} (${using.map(s => s.name).join(', ')}). Remove it from ${using.length === 1 ? 'that scale' : 'those scales'} first.`,
        confirmLabel: 'OK',
      })
      return
    }
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
        />
      ))}
    </SectionGrid>
  )

  const overlays = (
    <>
      <FontDrawer font={drawerFont} previewText={previewText} previewSize={previewSize} onClose={drawer.closeDrawer} onToggleFavourite={setFavourite} onDelete={handleDelete} />
      <FontAdder
        open={adderOpen}
        onClose={() => setAdderOpen(false)}
        existing={existingFamilies}
        onAddGoogle={addGoogle}
        onAddLocal={addLocal}
      />
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
            <FontPreviewControl text={previewText} size={previewSize} onTextChange={setPreviewText} onSizeChange={setPreviewSize} />
            <FavouriteToggle active={favOnly} onToggle={() => setFavOnly(v => !v)} />
            <Button variant="primary" size="md" onClick={() => setAdderOpen(true)}>
              <FontAwesomeIcon icon={faPlus} />
              Add font
            </Button>
          </>
        }
      />

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
            description={favOnly ? 'No favourites yet — star a font to see it here.' : 'No fonts in this project yet.'}
          />
        ) : grid}
      </div>
      {overlays}
    </>
  )
}
