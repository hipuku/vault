import React, { useState, useEffect } from 'react'
import type { TagWithCount } from '@shared/types'
import { Toolbar } from '../primitives/Toolbar/Toolbar'
import { EmptyState } from '../primitives/EmptyState/EmptyState'
import { ColorsPage } from './ColorsPage'
import { FontsPage } from './FontsPage'
import { PalettesPage } from './PalettesPage'
import { TypeScalesPage } from './TypeScalesPage'
import styles from './TagView.module.css'

/**
 * Aggregated cross-section view for a single tag: the four section pages
 * rendered in `embedded` mode (grid + drawer, no toolbar) under group headers.
 * Each embedded page hides itself when it has no items for the tag.
 */
export function TagView({ tagId }: { tagId: number }): React.ReactElement {
  const [tag, setTag] = useState<TagWithCount | null>(null)
  const [total, setTotal] = useState<number | null>(null)

  useEffect(() => {
    let live = true
    window.api.tag.list().then(tags => { if (live) setTag(tags.find(t => t.id === tagId) ?? null) })
    Promise.all([
      window.api.tag.listAssetIds('colour', tagId),
      window.api.tag.listAssetIds('font', tagId),
      window.api.tag.listAssetIds('palette', tagId),
      window.api.tag.listAssetIds('type_scale', tagId),
    ]).then(lists => { if (live) setTotal(lists.reduce((n, l) => n + l.length, 0)) })
    return () => { live = false }
  }, [tagId])

  return (
    <>
      <Toolbar
        title={
          <span className={styles.header}>
            {tag && <span className={styles.dot} style={{ background: tag.colour }} />}
            {tag?.label ?? 'Project'}
          </span>
        }
      />
      <div className="scroll-area">
        {total === 0 ? (
          <EmptyState
            title={`Nothing in "${tag?.label ?? ''}" yet`}
            description="Add colours, fonts, palettes, or type scales to this project from their drawers."
          />
        ) : (
          <div className={styles.groups}>
            <PalettesPage activeTagId={tagId} embedded={{ title: 'Palettes' }} />
            <TypeScalesPage activeTagId={tagId} embedded={{ title: 'Type Scales' }} />
            <ColorsPage activeTagId={tagId} embedded={{ title: 'Colors' }} />
            <FontsPage activeTagId={tagId} embedded={{ title: 'Fonts' }} />
          </div>
        )}
      </div>
    </>
  )
}
