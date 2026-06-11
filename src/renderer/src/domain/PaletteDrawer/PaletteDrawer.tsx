import React, { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faStar, faCopy as faDup, faTrash } from '@fortawesome/free-solid-svg-icons'
import type { Palette, Swatch, Tag } from '@shared/types'
import { Drawer } from '../../primitives/Drawer/Drawer'
import { Button } from '../../atoms/Button/Button'
import { Tag as TagPill } from '../../atoms/Tag/Tag'
import { CopyButton } from '../CopyButton/CopyButton'
import { SwatchItem } from '../SwatchItem/SwatchItem'
import { paletteToCss, swatchVarName } from '../../lib/paletteCss'
import styles from './PaletteDrawer.module.css'

interface PaletteDrawerProps {
  palette: Palette | null
  swatches: Swatch[]
  onClose: () => void
  onToggleFavourite: (id: number, favourite: 0 | 1) => void
  onDuplicate: (id: number) => void
  onDelete: (palette: Palette) => void
  onLabelChange: (paletteId: number, swatchId: number, label: string) => void
}

export function PaletteDrawer({ palette, swatches, onClose, onToggleFavourite, onDuplicate, onDelete, onLabelChange }: PaletteDrawerProps): React.ReactElement {
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [assigned, setAssigned] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (!palette) return
    let live = true
    Promise.all([window.api.tag.list(), window.api.tag.listForAsset('palette', palette.id)]).then(([tags, mine]) => {
      if (!live) return
      setAllTags(tags)
      setAssigned(new Set(mine.map(t => t.id)))
    })
    return () => { live = false }
  }, [palette])

  async function toggleTag(tag: Tag): Promise<void> {
    if (!palette) return
    if (assigned.has(tag.id)) {
      await window.api.tag.remove('palette', palette.id, tag.id)
      setAssigned(prev => { const n = new Set(prev); n.delete(tag.id); return n })
    } else {
      await window.api.tag.assign('palette', palette.id, tag.id)
      setAssigned(prev => new Set(prev).add(tag.id))
    }
  }

  return (
    <Drawer open={palette !== null} onClose={onClose}>
      {palette && (
        <div className={styles.content}>
          <div className={styles.strip}>
            {swatches.map(s => <span key={s.id} className={styles.stripSwatch} style={{ background: s.hex }} />)}
          </div>

          <div className={styles.head}>
            <span className={styles.name}>{palette.name}</span>
            <button
              type="button"
              className={[styles.star, palette.favourite ? styles.starOn : ''].filter(Boolean).join(' ')}
              onClick={() => onToggleFavourite(palette.id, palette.favourite ? 0 : 1)}
              aria-label={palette.favourite ? 'Unfavourite' : 'Favourite'}
            >
              <FontAwesomeIcon icon={faStar} />
            </button>
          </div>

          <div className={styles.copyAll}>
            <CopyButton value={paletteToCss(palette, swatches)} label="Copy all as CSS" />
          </div>

          <div className={styles.grid}>
            {swatches.map((s, i) => (
              <SwatchItem
                key={s.id}
                swatch={s}
                index={i}
                varName={swatchVarName(palette, s, i)}
                onLabelChange={(swatchId, label) => onLabelChange(palette.id, swatchId, label)}
              />
            ))}
          </div>

          <div className={styles.group}>
            <h3 className={styles.groupTitle}>Tags</h3>
            {allTags.length === 0 ? (
              <p className={styles.hint}>Create tags in the sidebar to organise palettes.</p>
            ) : (
              <div className={styles.tagList}>
                {allTags.map(tag => (
                  <TagPill key={tag.id} label={tag.label} colour={tag.colour} active={assigned.has(tag.id)} onClick={() => toggleTag(tag)} />
                ))}
              </div>
            )}
          </div>

          <div className={styles.footer}>
            <Button variant="secondary" size="md" onClick={() => onDuplicate(palette.id)}>
              <FontAwesomeIcon icon={faDup} />
              Duplicate
            </Button>
            <Button variant="danger" size="md" onClick={() => onDelete(palette)}>
              <FontAwesomeIcon icon={faTrash} />
              Delete
            </Button>
          </div>
        </div>
      )}
    </Drawer>
  )
}
