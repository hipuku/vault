import React, { useState, useEffect, useMemo } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus } from '@fortawesome/free-solid-svg-icons'
import type { TypeScale, Font } from '@shared/types'
import { Toolbar } from '../primitives/Toolbar/Toolbar'
import { EmptyState } from '../primitives/EmptyState/EmptyState'
import { SectionGrid } from '../primitives/SectionGrid/SectionGrid'
import { ConfirmDialog } from '../primitives/ConfirmDialog/ConfirmDialog'
import { Button } from '../atoms/Button/Button'
import { FavouriteToggle } from '../domain/FavouriteToggle/FavouriteToggle'
import { TypeScaleCard } from '../domain/TypeScaleCard/TypeScaleCard'
import { TypeScaleDrawer } from '../domain/TypeScaleDrawer/TypeScaleDrawer'
import { TypeScaleCreate } from '../domain/TypeScaleCreate/TypeScaleCreate'
import { TagGroup } from '../domain/TagGroup/TagGroup'
import { useTypeScales } from '../hooks/useTypeScales'
import { useFonts } from '../hooks/useFonts'
import { useDrawer } from '../hooks/useDrawer'
import { useConfirm } from '../hooks/useConfirm'
import { categoryGeneric } from '../lib/fontLoader'

function stackFor(fontId: number | null, fonts: Font[]): string {
  const f = fonts.find(x => x.id === fontId)
  return f ? `'${f.family}', ${categoryGeneric(f.category)}` : 'system-ui, sans-serif'
}

interface TypeScalesPageProps {
  activeTagId: number | null
  embedded?: { title: string }
}

export function TypeScalesPage({ activeTagId, embedded }: TypeScalesPageProps): React.ReactElement | null {
  const { scales, stepsByScale, create, setFavourite, remove } = useTypeScales()
  const { fonts } = useFonts()
  const [creating, setCreating] = useState(false)
  const [favOnly, setFavOnly] = useState(false)
  const [tagIds, setTagIds] = useState<Set<number> | null>(null)
  const drawer = useDrawer<TypeScale>()
  const confirm = useConfirm()

  useEffect(() => {
    if (activeTagId == null) { setTagIds(null); return }
    let live = true
    window.api.tag.listAssetIds('type_scale', activeTagId).then(ids => { if (live) setTagIds(new Set(ids)) })
    return () => { live = false }
  }, [activeTagId, drawer.open])

  const filtered = useMemo(
    () => scales.filter(s => {
      if (favOnly && !s.favourite) return false
      if (tagIds && !tagIds.has(s.id)) return false
      return true
    }),
    [scales, favOnly, tagIds]
  )

  async function handleDelete(scale: TypeScale): Promise<void> {
    const ok = await confirm.confirm({
      title: `Delete "${scale.name}"?`,
      message: 'This type scale will be removed. This can’t be undone.',
      confirmLabel: 'Delete type scale',
    })
    if (ok) { await remove(scale.id); drawer.closeDrawer() }
  }

  if (creating) {
    return (
      <TypeScaleCreate
        fonts={fonts}
        onCancel={() => setCreating(false)}
        onSave={async (name, headingFontId, bodyFontId, baseSize, ratio, steps) => {
          await create(name, headingFontId, bodyFontId, baseSize, ratio, steps)
          setCreating(false)
        }}
      />
    )
  }

  const drawerScale = drawer.item ? scales.find(s => s.id === drawer.item!.id) ?? null : null

  const grid = (
    <SectionGrid>
      {filtered.map(scale => (
        <TypeScaleCard
          key={scale.id}
          scale={scale}
          steps={stepsByScale[scale.id] ?? []}
          headingStack={stackFor(scale.heading_font_id, fonts)}
          bodyStack={stackFor(scale.body_font_id ?? scale.heading_font_id, fonts)}
          onOpen={drawer.openDrawer}
          onToggleFavourite={setFavourite}
        />
      ))}
    </SectionGrid>
  )

  const overlays = (
    <>
      <TypeScaleDrawer
        scale={drawerScale}
        steps={drawerScale ? stepsByScale[drawerScale.id] ?? [] : []}
        headingStack={stackFor(drawerScale?.heading_font_id ?? null, fonts)}
        bodyStack={stackFor((drawerScale?.body_font_id ?? drawerScale?.heading_font_id) ?? null, fonts)}
        onClose={drawer.closeDrawer}
        onToggleFavourite={setFavourite}
        onDelete={handleDelete}
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
        title="Type Scales"
        actions={
          <>
            <Button variant="primary" size="md" onClick={() => setCreating(true)}>
              <FontAwesomeIcon icon={faPlus} />
              New type scale
            </Button>
            <FavouriteToggle active={favOnly} onToggle={() => setFavOnly(v => !v)} />
          </>
        }
      />
      <div className="scroll-area">
        {scales.length === 0 ? (
          <EmptyState
            title="Pick a font from your library to start"
            description="Generate a 12-step semantic scale with a ratio preset, then fine-tune each step."
            action={<Button variant="primary" size="md" onClick={() => setCreating(true)}><FontAwesomeIcon icon={faPlus} />New type scale</Button>}
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No type scales match this filter"
            description={favOnly ? 'No favourites yet — star a scale to see it here.' : 'No scales carry this tag yet.'}
          />
        ) : grid}
      </div>
      {overlays}
    </>
  )
}
