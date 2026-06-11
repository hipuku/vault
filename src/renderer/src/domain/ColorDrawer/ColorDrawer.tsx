import React, { useState, useEffect, useMemo } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faStar, faTrash } from '@fortawesome/free-solid-svg-icons'
import type { Colour, Tag } from '@shared/types'
import { Drawer } from '../../primitives/Drawer/Drawer'
import { Button } from '../../atoms/Button/Button'
import { CopyButton } from '../CopyButton/CopyButton'
import { TagSelect } from '../TagSelect/TagSelect'
import { TagModal } from '../TagModal/TagModal'
import {
  toRgbString, toHslString, toCssVar, contrast, nearestNames, confidenceLabel, formatDeltaE, WHITE, BLACK,
} from '../../lib/colour'
import styles from './ColorDrawer.module.css'

interface ColorDrawerProps {
  colour: Colour | null
  onClose: () => void
  onRename: (id: number, name: string) => void
  onToggleFavourite: (id: number, favourite: 0 | 1) => void
  onDelete: (colour: Colour) => void
}

function ContrastRow({ hex, bg, label }: { hex: string; bg: string; label: string }): React.ReactElement {
  const { ratio, aa, aaa } = contrast(hex, bg)
  return (
    <div className={styles.contrastRow}>
      <span className={styles.contrastChip} style={{ background: bg, color: hex }}>Aa</span>
      <span className={styles.contrastLabel}>{label}</span>
      <span className={styles.contrastRatio}>{ratio.toFixed(2)}:1</span>
      <span className={[styles.wcag, aa ? styles.wcagPass : styles.wcagFail].join(' ')}>AA</span>
      <span className={[styles.wcag, aaa ? styles.wcagPass : styles.wcagFail].join(' ')}>AAA</span>
    </div>
  )
}

export function ColorDrawer({ colour, onClose, onRename, onToggleFavourite, onDelete }: ColorDrawerProps): React.ReactElement {
  const [name, setName] = useState('')
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [assigned, setAssigned] = useState<Set<number>>(new Set())
  const [tagModalOpen, setTagModalOpen] = useState(false)

  useEffect(() => {
    setName(colour?.name ?? '')
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

  function commitName(): void {
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
          <div className={styles.block} style={{ background: colour.hex }} />

          <div className={styles.section}>
            <input
              className={styles.name}
              value={name}
              onChange={e => setName(e.target.value)}
              onBlur={commitName}
              onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
              aria-label="Colour name"
            />
            <button
              type="button"
              className={[styles.star, colour.favourite ? styles.starOn : ''].filter(Boolean).join(' ')}
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
            <h3 className={styles.groupTitle}>Contrast</h3>
            <ContrastRow hex={colour.hex} bg={WHITE} label="on white" />
            <ContrastRow hex={colour.hex} bg={BLACK} label="on black" />
          </div>

          {naming && (
            <div className={styles.group}>
              <div className={styles.groupHead}>
                <h3 className={styles.groupTitle}>Nearest names</h3>
                <span className={styles.confidence}>{confidenceLabel(naming.confidence)}</span>
              </div>
              <div className={styles.nameList}>
                {[naming.best, ...naming.runners].map(m => (
                  <button
                    key={m.name + m.hex}
                    type="button"
                    className={[styles.nameRow, colour.name === m.name ? styles.nameRowOn : ''].filter(Boolean).join(' ')}
                    onClick={() => onRename(colour.id, m.name)}
                    title={`Use “${m.name}”`}
                  >
                    <span className={styles.nameSwatch} style={{ background: m.hex }} />
                    <span className={styles.nameText}>{m.name}</span>
                    <span className={styles.nameDelta}>ΔE {formatDeltaE(m.deltaE)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className={styles.group}>
            <h3 className={styles.groupTitle}>Tags</h3>
            <TagSelect allTags={allTags} selectedIds={assigned} onToggle={toggleTag} onCreateNew={() => setTagModalOpen(true)} />
          </div>

          <div className={styles.footer}>
            <Button variant="danger" size="md" onClick={() => onDelete(colour)}>
              <FontAwesomeIcon icon={faTrash} />
              Delete colour
            </Button>
          </div>
        </div>
      )}

      <TagModal open={tagModalOpen} mode="create" onSubmit={createTag} onClose={() => setTagModalOpen(false)} />
    </Drawer>
  )
}
