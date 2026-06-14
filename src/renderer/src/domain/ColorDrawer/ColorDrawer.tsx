import React, { useState, useEffect, useMemo } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faStar, faTrash, faPen, faRightLeft, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons'
import type { Colour, Tag } from '@shared/types'
import { Drawer } from '../../primitives/Drawer/Drawer'
import { Tooltip } from '../../primitives/Tooltip/Tooltip'
import { generateLightnessScale } from '@shared/lib/lightnessScale'
import { Button } from '../../atoms/Button/Button'
import { CopyButton } from '../CopyButton/CopyButton'
import { TagSelect } from '../TagSelect/TagSelect'
import { TagModal } from '../TagModal/TagModal'
import {
  toRgbString, toHslString, toCssVar, nearestNames, confidenceLabel, formatDeltaE, nearestShadeIndex,
} from '../../lib/colour'
import { ContrastChip } from '../ContrastChip/ContrastChip'
import styles from './ColorDrawer.module.css'

interface ColorDrawerProps {
  colour: Colour | null
  /** Full library — used to flag suggested names already taken by another colour. */
  library: Colour[]
  onClose: () => void
  onRename: (id: number, name: string) => void
  onToggleFavourite: (id: number, favourite: 0 | 1) => void
  onDelete: (colour: Colour) => void
}

export function ColorDrawer({ colour, library, onClose, onRename, onToggleFavourite, onDelete }: ColorDrawerProps): React.ReactElement {
  const [name, setName] = useState('')
  const [editing, setEditing] = useState(false)
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [assigned, setAssigned] = useState<Set<number>>(new Set())
  const [tagModalOpen, setTagModalOpen] = useState(false)
  const [newTagLabel, setNewTagLabel] = useState('')

  useEffect(() => {
    setName(colour?.name ?? '')
    setEditing(false)
    if (!colour) return
    let live = true
    Promise.all([window.api.tag.list(), window.api.tag.listForAsset('colour', colour.id)]).then(([tags, mine]) => {
      if (!live) return
      setAllTags(tags)
      setAssigned(new Set(mine.map(t => t.id)))
    })
    return () => { live = false }
  }, [colour])

  const naming = useMemo(() => (colour ? nearestNames(colour.hex, 6) : null), [colour])
  const shades = useMemo(() => (colour ? generateLightnessScale(colour.hex) : []), [colour])
  const activeShade = useMemo(() => (colour ? nearestShadeIndex(colour.hex, shades) : -1), [colour, shades])

  // Names already used by *another* colour — a suggestion matching one would collide on apply.
  const takenNames = useMemo(() => {
    const s = new Set<string>()
    for (const c of library) if (c.id !== colour?.id) s.add(c.name.toLowerCase())
    return s
  }, [library, colour?.id])

  function commitName(): void {
    setEditing(false)
    if (!colour) return
    const next = name.trim()
    if (next && next !== colour.name) onRename(colour.id, next)
    else setName(colour.name)
  }

  async function toggleTag(tag: Tag): Promise<void> {
    if (!colour) return
    if (assigned.has(tag.id)) {
      await window.api.tag.remove('colour', colour.id, tag.id)
      setAssigned(prev => { const n = new Set(prev); n.delete(tag.id); return n })
    } else {
      await window.api.tag.assign('colour', colour.id, tag.id)
      setAssigned(prev => new Set(prev).add(tag.id))
    }
  }

  async function createTag(label: string, col: string): Promise<void> {
    if (!colour) return
    const tag = await window.api.tag.create(label, col)
    await window.api.tag.assign('colour', colour.id, tag.id)
    setAllTags(prev => [...prev, tag].sort((a, b) => a.label.localeCompare(b.label)))
    setAssigned(prev => new Set(prev).add(tag.id))
    setTagModalOpen(false)
  }

  return (
    <Drawer open={colour !== null} onClose={onClose}>
      {colour && (
        <div className={styles.content}>
          <div className={styles.block} style={{ background: colour.hex }}>
            <div className={styles.blockShades} aria-hidden>
              {shades.map((s, i) => (
                <span
                  key={i}
                  className={[styles.blockShade, i === activeShade ? styles.blockShadeActive : ''].filter(Boolean).join(' ')}
                  style={{ background: s }}
                />
              ))}
            </div>
          </div>

          <div className={styles.section}>
            {editing ? (
              <input
                autoFocus
                className={styles.name}
                value={name}
                onChange={e => setName(e.target.value)}
                onBlur={commitName}
                onFocus={e => e.target.select()}
                onKeyDown={e => {
                  if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                  if (e.key === 'Escape') { setName(colour.name); setEditing(false) }
                }}
                aria-label="Colour name"
              />
            ) : (
              <span className={styles.name} title={name}>{name}</span>
            )}
            {!editing && (
              <div className={styles.nameActions}>
                <button type="button" className="icon-btn icon-btn--xs" onClick={() => setEditing(true)} aria-label="Rename">
                  <FontAwesomeIcon icon={faPen} />
                </button>
              </div>
            )}
            <button
              type="button"
              className={['icon-btn', styles.star, colour.favourite ? 'icon-btn--star' : ''].filter(Boolean).join(' ')}
              onClick={() => onToggleFavourite(colour.id, colour.favourite ? 0 : 1)}
              aria-label={colour.favourite ? 'Unfavourite' : 'Favourite'}
            >
              <FontAwesomeIcon icon={faStar} />
            </button>
          </div>

          <div className={styles.copyGrid}>
            <CopyButton block mono value={colour.hex} label={colour.hex} />
            <CopyButton block mono value={toRgbString(colour.hex)} label={toRgbString(colour.hex)} />
            <CopyButton block mono value={toHslString(colour.hex)} label={toHslString(colour.hex)} />
            <CopyButton block value={toCssVar(colour.name, colour.hex)} label="CSS variable" />
          </div>

          <div className={styles.group}>
            <h3 className="eyebrow">Contrast</h3>
            <ContrastChip hex={colour.hex} bg="white" />
            <ContrastChip hex={colour.hex} bg="black" />
          </div>

          {naming && (
            <div className={styles.group}>
              <div className={styles.groupHead}>
                <h3 className="eyebrow">Nearest names</h3>
                <span className={styles.confidence}>{confidenceLabel(naming.confidence)}</span>
              </div>
              <div className={styles.nameList}>
                {[naming.best, ...naming.runners]
                  .filter(m => m.name.toLowerCase() !== colour.name.toLowerCase())
                  .slice(0, 3)
                  .map(m => {
                  const taken = takenNames.has(m.name.toLowerCase())
                  return (
                    <div key={m.name + m.hex} className={styles.nameRow}>
                      <span className={styles.nameSwatch} style={{ background: m.hex }} />
                      <span className={styles.nameMain}>
                        <span className={styles.nameText}>{m.name}</span>
                        {taken && (
                          <Tooltip label={`You already have a colour named “${m.name}”`} align="start">
                            <span className={styles.nameWarn}>
                              <FontAwesomeIcon icon={faTriangleExclamation} />
                            </span>
                          </Tooltip>
                        )}
                      </span>
                      <span className={styles.nameDelta}>ΔE {formatDeltaE(m.deltaE)}</span>
                      <div className={styles.nameActions}>
                        <button
                          type="button"
                          className="icon-btn icon-btn--sm icon-btn--primary"
                          onClick={() => onRename(colour.id, m.name)}
                          aria-label={`Use “${m.name}”`}
                        >
                          <FontAwesomeIcon icon={faRightLeft} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div className={styles.group}>
            <h3 className="eyebrow">Projects</h3>
            <TagSelect allTags={allTags} selectedIds={assigned} onToggle={toggleTag} onCreateNew={(label) => { setNewTagLabel(label); setTagModalOpen(true) }} />
          </div>

          <div className={styles.footer}>
            <Button variant="danger" size="md" onClick={() => onDelete(colour)}>
              <FontAwesomeIcon icon={faTrash} />
              Delete colour
            </Button>
          </div>
        </div>
      )}

      <TagModal open={tagModalOpen} mode="create" initial={{ label: newTagLabel }} onSubmit={createTag} onClose={() => setTagModalOpen(false)} />
    </Drawer>
  )
}
