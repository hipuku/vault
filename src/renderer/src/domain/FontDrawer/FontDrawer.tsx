import React, { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faStar, faTrash, faFolderOpen, faDownload, faArrowUpRightFromSquare } from '@fortawesome/free-solid-svg-icons'
import type { Font, Tag } from '@shared/types'
import { Drawer } from '../../primitives/Drawer/Drawer'
import { Button } from '../../atoms/Button/Button'
import { TagSelect } from '../TagSelect/TagSelect'
import { TagModal } from '../TagModal/TagModal'
import { CopyButton } from '../CopyButton/CopyButton'
import { parseWeights, fontStack, googleCssUrl, loadGoogleFont, localFontPaths } from '../../lib/fontLoader'
import styles from './FontDrawer.module.css'

interface FontDrawerProps {
  font: Font | null
  previewText: string
  previewSize: number
  onClose: () => void
  onToggleFavourite: (id: number, favourite: 0 | 1) => void
  onDelete: (font: Font) => void
}

const WEIGHT_NAMES: Record<string, string> = {
  '100': 'Thin', '200': 'ExtraLight', '300': 'Light', '400': 'Regular',
  '500': 'Medium', '600': 'SemiBold', '700': 'Bold', '800': 'ExtraBold', '900': 'Black',
}

export function FontDrawer({ font, previewText, previewSize, onClose, onToggleFavourite, onDelete }: FontDrawerProps): React.ReactElement {
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [assigned, setAssigned] = useState<Set<number>>(new Set())
  const [tagModalOpen, setTagModalOpen] = useState(false)
  const [newTagLabel, setNewTagLabel] = useState('')

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

  async function createTag(label: string, col: string): Promise<void> {
    if (!font) return
    const tag = await window.api.tag.create(label, col)
    await window.api.tag.assign('font', font.id, tag.id)
    setAllTags(prev => [...prev, tag].sort((a, b) => a.label.localeCompare(b.label)))
    setAssigned(prev => new Set(prev).add(tag.id))
    setTagModalOpen(false)
  }

  const weights = font ? parseWeights(font.weights) : []
  const stack = font ? fontStack(font) : ''
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
              className={['icon-btn', styles.star, font.favourite ? 'icon-btn--star' : ''].filter(Boolean).join(' ')}
              onClick={() => onToggleFavourite(font.id, font.favourite ? 0 : 1)}
              aria-label={font.favourite ? 'Unfavourite' : 'Favourite'}
            >
              <FontAwesomeIcon icon={faStar} />
            </button>
          </div>
          <p className={styles.sub}>{font.category} · {font.source === 'google' ? 'Google Fonts' : 'Local file'}</p>

          {/* Each weight is its own titled block (eyebrow heading + specimen). */}
          {weights.map(w => (
            <div key={w} className={styles.group}>
              <h3 className="eyebrow">{WEIGHT_NAMES[w] ?? w} {w}</h3>
              <span className={styles.specimen} style={{ fontFamily: stack, fontWeight: Number(w), fontSize: previewSize }}>
                {previewText || 'The quick brown fox'}
              </span>
            </div>
          ))}

          <div className={styles.group}>
            <h3 className="eyebrow">Use</h3>
            <div className={styles.copyRow}>
              <CopyButton value={fontFamilyCss} label="font-family" />
              {importCss && <CopyButton value={importCss} label="@import" />}
            </div>
          </div>

          <div className={styles.group}>
            <h3 className="eyebrow">File</h3>
            {font.source === 'local' ? (
              <span className={styles.fileActions}>
                <Button variant="secondary" size="md" onClick={() => { const p = localFontPaths(font)[0]; if (p) window.api.font.reveal(p) }}>
                  <FontAwesomeIcon icon={faFolderOpen} /> Show in Finder
                </Button>
              </span>
            ) : (
              <span className={styles.fileActions}>
                <Button variant="secondary" size="md" onClick={() => { void window.api.font.downloadGoogle(font.family, weights) }}>
                  <FontAwesomeIcon icon={faDownload} /> Download font file
                </Button>
                <Button variant="ghost" size="md" onClick={() => window.open(`https://fonts.google.com/specimen/${font.family.replace(/ /g, '+')}`, '_blank')}>
                  <FontAwesomeIcon icon={faArrowUpRightFromSquare} /> View on Google Fonts
                </Button>
              </span>
            )}
          </div>

          <div className={styles.group}>
            <h3 className="eyebrow">Projects</h3>
            <TagSelect allTags={allTags} selectedIds={assigned} onToggle={toggleTag} onCreateNew={(label) => { setNewTagLabel(label); setTagModalOpen(true) }} />
          </div>

          <div className={styles.footer}>
            <Button variant="danger" size="md" onClick={() => onDelete(font)}>
              <FontAwesomeIcon icon={faTrash} />
              Delete font
            </Button>
          </div>
        </div>
      )}

      <TagModal open={tagModalOpen} mode="create" initial={{ label: newTagLabel }} onSubmit={createTag} onClose={() => setTagModalOpen(false)} />
    </Drawer>
  )
}
