import React, { useMemo } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPen, faBarsStaggered, faTableColumns } from '@fortawesome/free-solid-svg-icons'
import type { Palette, Swatch } from '@shared/types'
import { Pill } from '../../atoms/Pill/Pill'
import styles from './PaletteCard.module.css'

interface PaletteCardProps {
  palette: Palette
  swatches: Swatch[]
  onOpen: (palette: Palette) => void
}

export function PaletteCard({ palette, swatches, onOpen }: PaletteCardProps): React.ReactElement {
  // Group swatches by group_key, ordered by min sort_order within each group.
  const groups = useMemo(() => {
    const map = new Map<string, Swatch[]>()
    for (const s of swatches) {
      if (!map.has(s.group_key)) map.set(s.group_key, [])
      map.get(s.group_key)!.push(s)
    }
    return Array.from(map.entries()).sort(([, a], [, b]) =>
      Math.min(...a.map(s => s.sort_order)) - Math.min(...b.map(s => s.sort_order))
    )
  }, [swatches])

  const count = groups.length
  const meta = palette.kind === 'expressive'
    ? { icon: faTableColumns, label: 'Expressive', value: `${count} ${count === 1 ? 'hue' : 'hues'}` }
    : { icon: faBarsStaggered, label: 'Tonal', value: `${count} ${count === 1 ? 'ramp' : 'ramps'}` }

  return (
    <button type="button" className={styles.card} onClick={() => onOpen(palette)} aria-label={`Open ${palette.name}`}>
      <div className={styles.preview}>
        {palette.kind === 'expressive' ? (
          <div className={styles.expGrid}>
            {groups.map(([key, gs]) => (
              <div key={key} className={styles.expCol}>
                {gs.map(s => <span key={s.id} className={styles.expSwatch} style={{ background: s.hex }} />)}
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.tonalRows}>
            {groups.map(([key, gs]) => (
              <div key={key} className={styles.tonalRow}>
                {gs.map(s => <span key={s.id} className={styles.swatch} style={{ background: s.hex }} />)}
              </div>
            ))}
          </div>
        )}
        <span className={styles.edit}><FontAwesomeIcon icon={faPen} /></span>
      </div>

      <div className={styles.body}>
        <span className={styles.name}>{palette.name}</span>
        <div className={styles.meta}>
          <Pill icon={meta.icon} label={meta.label} />
          <span className={styles.value}>{meta.value}</span>
        </div>
      </div>
    </button>
  )
}
