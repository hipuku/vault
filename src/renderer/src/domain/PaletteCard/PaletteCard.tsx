import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faStar, faEllipsisVertical, faCopy, faTrash } from '@fortawesome/free-solid-svg-icons'
import type { Palette, Swatch, Tag } from '@shared/types'
import { Menu } from '../../primitives/Menu/Menu'
import styles from './PaletteCard.module.css'

interface PaletteCardProps {
  palette: Palette
  swatches: Swatch[]
  tags: Tag[]
  onOpen: (palette: Palette) => void
  onDuplicate: (id: number) => void
  onDelete: (palette: Palette) => void
  onToggleFavourite: (id: number, favourite: 0 | 1) => void
}

export function PaletteCard({ palette, swatches, tags, onOpen, onDuplicate, onDelete, onToggleFavourite }: PaletteCardProps): React.ReactElement {
  return (
    <div className={styles.card}>
      <button type="button" className={styles.strip} onClick={() => onOpen(palette)} aria-label={`Open ${palette.name}`}>
        {swatches.map(s => (
          <span key={s.id} className={styles.swatch} style={{ background: s.hex }} />
        ))}
      </button>

      <div className={styles.footer}>
        <div className={styles.nameRow}>
          <span className={styles.name}>{palette.name}</span>
          <div className={styles.actions}>
            <button
              type="button"
              className={[styles.star, palette.favourite ? styles.starOn : ''].filter(Boolean).join(' ')}
              onClick={() => onToggleFavourite(palette.id, palette.favourite ? 0 : 1)}
              aria-label={palette.favourite ? 'Unfavourite' : 'Favourite'}
            >
              <FontAwesomeIcon icon={faStar} />
            </button>
            <Menu
              triggerLabel="Palette actions"
              trigger={<FontAwesomeIcon icon={faEllipsisVertical} />}
              items={[
                { label: 'Duplicate', icon: faCopy, onClick: () => onDuplicate(palette.id) },
                { label: 'Delete', icon: faTrash, danger: true, onClick: () => onDelete(palette) },
              ]}
            />
          </div>
        </div>
        {tags.length > 0 && (
          <div className={styles.tags}>
            {tags.map(t => (
              <span key={t.id} className={styles.tag}>
                <span className={styles.tagDot} style={{ background: t.colour }} />
                {t.label}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
