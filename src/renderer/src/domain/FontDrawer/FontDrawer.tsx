import React, { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faStar, faTrash } from '@fortawesome/free-solid-svg-icons'
import type { Font, Tag } from '@shared/types'
import { Drawer } from '../../primitives/Drawer/Drawer'
import { Button } from '../../atoms/Button/Button'
import { Tag as TagPill } from '../../atoms/Tag/Tag'
import { CopyButton } from '../CopyButton/CopyButton'
import { parseWeights, categoryGeneric, googleCssUrl, loadGoogleFont } from '../../lib/fontLoader'
import styles from './FontDrawer.module.css'

interface FontDrawerProps {
  font: Font | null
  onClose: () => void
  onToggleFavourite: (id: number, favourite: 0 | 1) => void
  onDelete: (font: Font) => void
}

const WEIGHT_NAMES: Record<string, string> = {
  '100': 'Thin', '200': 'ExtraLight', '300': 'Light', '400': 'Regular',
  '500': 'Medium', '600': 'SemiBold', '700': 'Bold', '800': 'ExtraBold', '900': 'Black',
}

export function FontDrawer({ font, onClose, onToggleFavourite, onDelete }: FontDrawerProps): React.ReactElement {
  const [preview, setPreview] = useState('The quick brown fox jumps over the lazy dog')
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [assigned, setAssigned] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (!font) return
    if (font.source === 'google') loadGoogleFont(font.family, parseWeights(font.weights))
    let live = true
    Promise.all([window.api.tag.list(), window.api.tag.listForAsset('font', font.id)]).then(([tags, mine]) => {
      if (!live) return
      setAllTags(tags)
      setAssigned(new Set(mine.map(t => t.id)))
    })
    return () => { live = false }
  }, [font])

  async function toggleTag(tag: Tag): Promise<void> {
    if (!font) return
    if (assigned.has(tag.id)) {
      await window.api.tag.remove('font', font.id, tag.id)
      setAssigned(prev => { const n = new Set(prev); n.delete(tag.id); return n })
    } else {
      await window.api.tag.assign('font', font.id, tag.id)
      setAssigned(prev => new Set(prev).add(tag.id))
    }
  }

  const weights = font ? parseWeights(font.weights) : []
  const stack = font ? `'${font.family}', ${categoryGeneric(font.category)}` : ''
  const fontFamilyCss = font ? `font-family: ${stack};` : ''
  const importCss = font && font.source === 'google'
    ? `@import url('${googleCssUrl(font.family, weights)}');`
    : ''

  return (
    <Drawer open={font !== null} onClose={onClose}>
      {font && (
        <div className={styles.content}>
          <div className={styles.head}>
            <span className={styles.bigName} style={{ fontFamily: stack }}>{font.family}</span>
            <button
              type="button"
              className={[styles.star, font.favourite ? styles.starOn : ''].filter(Boolean).join(' ')}
              onClick={() => onToggleFavourite(font.id, font.favourite ? 0 : 1)}
              aria-label={font.favourite ? 'Unfavourite' : 'Favourite'}
            >
              <FontAwesomeIcon icon={faStar} />
            </button>
          </div>
          <p className={styles.sub}>{font.category} · {font.source === 'google' ? 'Google Fonts' : 'Local file'}</p>

          <div className={styles.group}>
            <input
              className={styles.previewInput}
              value={preview}
              onChange={e => setPreview(e.target.value)}
              aria-label="Preview text"
            />
          </div>

          <div className={styles.group}>
            <h3 className={styles.groupTitle}>Weights</h3>
            <div className={styles.specimens}>
              {weights.map(w => (
                <div key={w} className={styles.specimenRow}>
                  <span className={styles.specimenLabel}>{WEIGHT_NAMES[w] ?? w} {w}</span>
                  <span className={styles.specimen} style={{ fontFamily: stack, fontWeight: Number(w) }}>
                    {preview || 'The quick brown fox'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.group}>
            <h3 className={styles.groupTitle}>Use</h3>
            <div className={styles.copyRow}>
              <CopyButton value={fontFamilyCss} label="font-family" />
              {importCss && <CopyButton value={importCss} label="@import" />}
            </div>
            {font.source === 'local' && <p className={styles.path}>{font.source_url}</p>}
          </div>

          <div className={styles.group}>
            <h3 className={styles.groupTitle}>Tags</h3>
            {allTags.length === 0 ? (
              <p className={styles.hint}>Create tags in the sidebar to organise fonts.</p>
            ) : (
              <div className={styles.tagList}>
                {allTags.map(tag => (
                  <TagPill key={tag.id} label={tag.label} colour={tag.colour} active={assigned.has(tag.id)} onClick={() => toggleTag(tag)} />
                ))}
              </div>
            )}
          </div>

          <div className={styles.footer}>
            <Button variant="danger" size="md" onClick={() => onDelete(font)}>
              <FontAwesomeIcon icon={faTrash} />
              Delete font
            </Button>
          </div>
        </div>
      )}
    </Drawer>
  )
}
