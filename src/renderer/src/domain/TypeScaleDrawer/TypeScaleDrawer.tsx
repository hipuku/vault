import React, { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faStar, faTrash } from '@fortawesome/free-solid-svg-icons'
import type { TypeScale, TypeScaleStep, Tag } from '@shared/types'
import { Drawer } from '../../primitives/Drawer/Drawer'
import { Button } from '../../atoms/Button/Button'
import { Tag as TagPill } from '../../atoms/Tag/Tag'
import { CopyButton } from '../CopyButton/CopyButton'
import { SpecimenTable, type PreviewMode } from '../SpecimenTable/SpecimenTable'
import { stepToCss, scaleToCss } from '../../lib/typeScaleCss'
import styles from './TypeScaleDrawer.module.css'

interface TypeScaleDrawerProps {
  scale: TypeScale | null
  steps: TypeScaleStep[]
  headingStack: string
  bodyStack: string
  onClose: () => void
  onToggleFavourite: (id: number, favourite: 0 | 1) => void
  onDelete: (scale: TypeScale) => void
}

const MODES: Array<{ key: PreviewMode; label: string }> = [
  { key: 'role', label: 'By role' },
  { key: 'heading', label: 'Heading' },
  { key: 'body', label: 'Body' },
]

export function TypeScaleDrawer({ scale, steps, headingStack, bodyStack, onClose, onToggleFavourite, onDelete }: TypeScaleDrawerProps): React.ReactElement {
  const [preview, setPreview] = useState('The quick brown fox')
  const [mode, setMode] = useState<PreviewMode>('role')
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [assigned, setAssigned] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (!scale) return
    let live = true
    Promise.all([window.api.tag.list(), window.api.tag.listForAsset('type_scale', scale.id)]).then(([tags, mine]) => {
      if (!live) return
      setAllTags(tags)
      setAssigned(new Set(mine.map(t => t.id)))
    })
    return () => { live = false }
  }, [scale])

  async function toggleTag(tag: Tag): Promise<void> {
    if (!scale) return
    if (assigned.has(tag.id)) {
      await window.api.tag.remove('type_scale', scale.id, tag.id)
      setAssigned(prev => { const n = new Set(prev); n.delete(tag.id); return n })
    } else {
      await window.api.tag.assign('type_scale', scale.id, tag.id)
      setAssigned(prev => new Set(prev).add(tag.id))
    }
  }

  return (
    <Drawer open={scale !== null} onClose={onClose}>
      {scale && (
        <div className={styles.content}>
          <div className={styles.head}>
            <span className={styles.name}>{scale.name}</span>
            <button
              type="button"
              className={[styles.star, scale.favourite ? styles.starOn : ''].filter(Boolean).join(' ')}
              onClick={() => onToggleFavourite(scale.id, scale.favourite ? 0 : 1)}
              aria-label={scale.favourite ? 'Unfavourite' : 'Favourite'}
            >
              <FontAwesomeIcon icon={faStar} />
            </button>
          </div>

          <div className={styles.controls}>
            <input className={styles.previewInput} value={preview} onChange={e => setPreview(e.target.value)} aria-label="Preview text" />
            <div className={styles.modeToggle}>
              {MODES.map(m => (
                <button key={m.key} type="button" className={[styles.mode, mode === m.key ? styles.modeOn : ''].filter(Boolean).join(' ')} onClick={() => setMode(m.key)}>
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.tableWrap}>
            <SpecimenTable
              steps={steps}
              headingStack={headingStack}
              bodyStack={bodyStack}
              previewText={preview}
              mode={mode}
              renderTrailing={step => <CopyButton value={stepToCss(step)} label="CSS" />}
            />
          </div>

          <div className={styles.copyAll}>
            <CopyButton value={scaleToCss(steps)} label="Copy all as CSS" />
          </div>

          <div className={styles.group}>
            <h3 className={styles.groupTitle}>Tags</h3>
            {allTags.length === 0 ? (
              <p className={styles.hint}>Create tags in the sidebar to organise type scales.</p>
            ) : (
              <div className={styles.tagList}>
                {allTags.map(tag => (
                  <TagPill key={tag.id} label={tag.label} colour={tag.colour} active={assigned.has(tag.id)} onClick={() => toggleTag(tag)} />
                ))}
              </div>
            )}
          </div>

          <div className={styles.footer}>
            <Button variant="danger" size="md" onClick={() => onDelete(scale)}>
              <FontAwesomeIcon icon={faTrash} />
              Delete type scale
            </Button>
          </div>
        </div>
      )}
    </Drawer>
  )
}
