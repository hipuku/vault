import React, { useState, useEffect, useMemo } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus } from '@fortawesome/free-solid-svg-icons'
import type { Colour } from '@shared/types'
import { Toolbar } from '../molecules/Toolbar/Toolbar'
import { EmptyState } from '../molecules/EmptyState/EmptyState'
import { SectionGrid } from '../molecules/SectionGrid/SectionGrid'
import { ConfirmDialog } from '../molecules/ConfirmDialog/ConfirmDialog'
import { Button } from '../atoms/Button/Button'
import { FavouriteToggle } from '../molecules/FavouriteToggle/FavouriteToggle'
import { ColorCard } from '../organisms/ColorCard/ColorCard'
import { ColorDrawer } from '../organisms/ColorDrawer/ColorDrawer'
import { AddColorModal } from '../organisms/AddColorModal/AddColorModal'
import { TagGroup } from '../molecules/TagGroup/TagGroup'
import { ColorFilters } from '../organisms/ColorFilters/ColorFilters'
import { useColours } from '../hooks/useColours'
import { useDrawer } from '../hooks/useDrawer'
import { useConfirm } from '../hooks/useConfirm'
import { sortColours, groupColours, type SortKey, type GroupKey } from '../lib/colourSort'
import { warmColourNames } from '../lib/colour'
import styles from './ColorsPage.module.css'

interface ColorsPageProps {
  activeTagId: number | null
  embedded?: { title: string }
  openCreate?: boolean
  onCreateConsumed?: () => void
  openItemId?: number | null
  onItemOpened?: () => void
}

export function ColorsPage({ activeTagId, embedded, openCreate, onCreateConsumed, openItemId, onItemOpened }: ColorsPageProps): React.ReactElement | null {
  const { colours, addColour, renameColour, setFavourite, removeColour, loadError } = useColours()
  const [favOnly, setFavOnly] = useState(false)
  const [tagIds, setTagIds] = useState<Set<number> | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>('recent')
  const [groupKey, setGroupKey] = useState<GroupKey>('none')
  const drawer = useDrawer<Colour>()
  const confirm = useConfirm()

  useEffect(() => { warmColourNames() }, [])

  // Opened from the command palette (⌘K → "Add colour").
  useEffect(() => {
    if (openCreate) { setAddOpen(true); onCreateConsumed?.() }
  }, [openCreate, onCreateConsumed])

  // Selected a specific colour in the command palette → open its drawer.
  useEffect(() => {
    if (openItemId == null || colours.length === 0) return
    const colour = colours.find(c => c.id === openItemId)
    if (colour) drawer.openDrawer(colour)
    onItemOpened?.()
  }, [openItemId, colours, onItemOpened, drawer])

  async function addColours(list: Array<{ hex: string; name: string }>): Promise<void> {
    for (const { hex, name } of list) await addColour(hex, name)
  }

  // Sidebar tag (cross-section TagView / embedded) → constrains to one tag.
  useEffect(() => {
    if (activeTagId == null) { setTagIds(null); return }
    let live = true
    window.api.tag.listAssetIds('colour', activeTagId).then(ids => { if (live) setTagIds(new Set(ids)) })
    return () => { live = false }
  }, [activeTagId, drawer.open])

  const filtered = useMemo(
    () => colours.filter(c => {
      if (favOnly && !c.favourite) return false
      if (tagIds && !tagIds.has(c.id)) return false
      return true
    }),
    [colours, favOnly, tagIds]
  )

  const groups = useMemo(
    () => groupColours(sortColours(filtered, sortKey), groupKey),
    [filtered, sortKey, groupKey]
  )

  async function handleDelete(colour: Colour): Promise<void> {
    const using = await window.api.colour.palettesUsing(colour.id)
    if (using.length > 0) {
      await confirm.confirm({
        title: `Can’t delete “${colour.name}”`,
        message: `It’s used to build ${using.length} palette${using.length === 1 ? '' : 's'} (${using.map(p => p.name).join(', ')}). Remove it from ${using.length === 1 ? 'that palette' : 'those palettes'} first.`,
        confirmLabel: 'OK',
      })
      return
    }
    const ok = await confirm.confirm({
      title: `Delete "${colour.name}"?`,
      message: 'This colour will be removed from your library. This can’t be undone.',
      confirmLabel: 'Delete colour',
    })
    if (ok) { await removeColour(colour.id); drawer.closeDrawer() }
  }

  const drawerColour = drawer.item ? colours.find(c => c.id === drawer.item!.id) ?? null : null

  const card = (colour: Colour): React.ReactElement => (
    <ColorCard key={colour.id} colour={colour} onOpen={drawer.openDrawer} />
  )

  const grids =
    groupKey === 'none'
      ? <SectionGrid>{groups[0]?.colours.map(card)}</SectionGrid>
      : groups.map(g => (
          <TagGroup key={g.title} title={g.title} count={g.colours.length}>
            <SectionGrid>{g.colours.map(card)}</SectionGrid>
          </TagGroup>
        ))

  const overlays = (
    <>
      <ColorDrawer
        colour={drawerColour}
        library={colours}
        onClose={drawer.closeDrawer}
        onRename={renameColour}
        onToggleFavourite={setFavourite}
        onDelete={handleDelete}
      />
      <AddColorModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        library={colours}
        onAdd={addColour}
        onAddMany={addColours}
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
        <TagGroup title={embedded.title} count={filtered.length}>
          <SectionGrid>{sortColours(filtered, sortKey).map(card)}</SectionGrid>
        </TagGroup>
        {overlays}
      </>
    )
  }

  return (
    <>
      <Toolbar
        title="Colors"
        actions={
          <>
            <ColorFilters
              sortKey={sortKey}
              onSortChange={setSortKey}
              groupKey={groupKey}
              onGroupChange={setGroupKey}
            />
            <FavouriteToggle active={favOnly} onToggle={() => setFavOnly(v => !v)} />
            <Button variant="primary" size="md" onClick={() => setAddOpen(true)}>
              <FontAwesomeIcon icon={faPlus} />
              Add colour
            </Button>
          </>
        }
      />
      <div className="scroll-area">
        {loadError ? (
          <EmptyState
            title="Couldn’t open your library"
            description={loadError}
          />
        ) : colours.length === 0 ? (
          <EmptyState
            title="Add your first colour"
            description="Add by hex or extract from an image. We’ll suggest a name, check WCAG contrast, and flag near-duplicates."
            action={<Button variant="primary" size="md" onClick={() => setAddOpen(true)}><FontAwesomeIcon icon={faPlus} />Add colour</Button>}
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No colours match this filter"
            description={favOnly ? 'No favourites yet — star a colour to see it here.' : 'No colours in this project yet.'}
          />
        ) : (
          <div className={styles.groups}>{grids}</div>
        )}
      </div>
      {overlays}
    </>
  )
}
