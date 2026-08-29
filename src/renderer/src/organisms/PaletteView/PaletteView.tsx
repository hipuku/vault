import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faChevronLeft,
  faTrash,
  faArrowUpFromBracket,
  faCircleCheck,
  faFileExport,
  faBarsStaggered,
  faTableColumns,
} from '@fortawesome/free-solid-svg-icons'
import type { Palette, Swatch, Tag, Colour } from '@shared/types'
import { Toolbar } from '../../molecules/Toolbar/Toolbar'
import { Button } from '../../atoms/Button/Button'
import { IconButton } from '../../atoms/IconButton/IconButton'
import { Panel } from '../../atoms/Panel/Panel'
import { Pill } from '../../atoms/Pill/Pill'
import { EditableName } from '../../atoms/EditableName/EditableName'
import { Badge } from '../../atoms/Badge/Badge'
import { ExportModal } from '../../organisms/ExportModal/ExportModal'
import { AddColorModal } from '../../organisms/AddColorModal/AddColorModal'
import { EXPORT_FORMATS, exportPalette, type ExportFormat } from '../../lib/paletteExport'
import { nearestNames } from '../../lib/colour'
import { TONAL_STOP_LABELS } from '@shared/lib/tonalSystem'
import {
  analyseHueArc,
  analyseChroma,
  analyseLightness,
  findNearIdentical,
  analyseRamp,
  type QualityRating,
} from '@shared/lib/paletteAnalyser'

const ratingVariant = (r: QualityRating): 'success' | 'warning' | 'error' =>
  r === 'good' ? 'success' : r === 'fair' ? 'warning' : 'error'
import styles from './PaletteView.module.css'

const RAMP_LABEL: Record<string, string> = {
  primary: 'Primary',
  neutral: 'Neutral',
  success: 'Success',
  warning: 'Warning',
  error: 'Error',
}

interface PaletteViewProps {
  palette: Palette
  swatches: Swatch[]
  onBack: () => void
  onRename: (id: number, name: string) => void
  onDelete: (palette: Palette) => void
  onPromote: (paletteId: number, swatchId: number, name: string) => Promise<unknown>
}

// ── One swatch + label, with hover promote-to-library ─────────────────────────

interface StopProps {
  swatch: Swatch
  label: string
  onPromoteClick: (swatch: Swatch) => void
}

function Stop({ swatch, label, onPromoteClick }: StopProps): React.ReactElement {
  const inLibrary = swatch.colour_id != null
  return (
    <div className={styles.stop}>
      <div className={styles.swatchWrap}>
        <span className={styles.swatch} style={{ background: swatch.hex }} title={swatch.hex} />
        {inLibrary ? (
          <span className={styles.inLib} title="In library">
            <FontAwesomeIcon icon={faCircleCheck} />
          </span>
        ) : (
          <button
            type="button"
            className={styles.promote}
            onClick={() => onPromoteClick(swatch)}
            aria-label="Save to library"
            title="Save to library"
          >
            <FontAwesomeIcon icon={faArrowUpFromBracket} />
          </button>
        )}
      </div>
      <span className={styles.stopLabel}>{label}</span>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function PaletteView({
  palette,
  swatches,
  onBack,
  onRename,
  onDelete,
  onPromote,
}: PaletteViewProps): React.ReactElement {
  const [library, setLibrary] = useState<Colour[]>([])
  const [project, setProject] = useState<Tag | null>(null)
  const [exportOpen, setExportOpen] = useState(false)
  const [promoting, setPromoting] = useState<Swatch | null>(null)

  useEffect(() => {
    let live = true
    Promise.all([window.api.tag.listForAsset('palette', palette.id), window.api.colour.list()]).then(
      ([mine, colours]) => {
        if (!live) return
        setProject(mine[0] ?? null) // palettes belong to exactly one project
        setLibrary(colours)
      },
    )
    return () => {
      live = false
    }
  }, [palette.id])

  const handlePromote = useCallback(
    async (swatchId: number, name: string): Promise<void> => {
      await onPromote(palette.id, swatchId, name)
      setLibrary(await window.api.colour.list())
    },
    [palette.id, onPromote],
  )

  const groups = useMemo(() => {
    const map = new Map<string, Swatch[]>()
    for (const s of swatches) {
      if (!map.has(s.group_key)) map.set(s.group_key, [])
      map.get(s.group_key)!.push(s)
    }
    return Array.from(map.entries()).sort(
      ([, a], [, b]) => Math.min(...a.map(s => s.sort_order)) - Math.min(...b.map(s => s.sort_order)),
    )
  }, [swatches])

  const nameForGroup = useCallback(
    (gs: Swatch[]): string => {
      const mid = gs.find(s => s.label === '') ?? gs[Math.floor(gs.length / 2)]
      if (mid?.colour_id != null) {
        const linked = library.find(c => c.id === mid.colour_id)
        if (linked) return linked.name
      }
      return nearestNames(mid?.hex ?? '#888888', 1).best.name
    },
    [library],
  )

  const isTonal = palette.kind === 'tonal'

  const groupNames = useMemo(() => {
    const m: Record<string, string> = {}
    for (const [key, gs] of groups) m[key] = isTonal ? key : nameForGroup(gs)
    return m
  }, [groups, isTonal, nameForGroup])

  const count = groups.length
  const kindMeta = isTonal
    ? { icon: faBarsStaggered, label: 'Tonal', value: `${count} ${count === 1 ? 'ramp' : 'ramps'}` }
    : { icon: faTableColumns, label: 'Expressive', value: `${count} ${count === 1 ? 'hue' : 'hues'}` }

  // Quality, summarised as semantic chips in the hero.
  const quality = useMemo(() => {
    if (isTonal) {
      const ramp = groups[0]?.[1].map(s => s.hex) ?? []
      if (ramp.length < 2) return null
      const r = analyseRamp(ramp)
      return { kind: 'tonal' as const, ...r }
    }
    const mids = swatches.filter(s => s.label === '').map(s => s.hex)
    if (mids.length === 0) return null
    return {
      kind: 'expressive' as const,
      hue: analyseHueArc(mids).totalAngle,
      chroma: analyseChroma(mids).rating,
      lightness: analyseLightness(mids).rating,
      near: findNearIdentical(mids).length,
    }
  }, [isTonal, groups, swatches])

  return (
    <>
      <Toolbar
        title={
          <span className={styles.titleRow}>
            <IconButton label="Back to palettes" onClick={onBack}>
              <FontAwesomeIcon icon={faChevronLeft} />
            </IconButton>
            <EditableName value={palette.name} onCommit={n => onRename(palette.id, n)} ariaLabel="palette name" />
          </span>
        }
        actions={
          <>
            <Button variant="secondary" size="md" onClick={() => setExportOpen(true)}>
              <FontAwesomeIcon icon={faFileExport} /> Export
            </Button>
            <Button variant="danger" size="md" onClick={() => onDelete(palette)}>
              <FontAwesomeIcon icon={faTrash} /> Delete
            </Button>
          </>
        }
      />

      <div className="scroll-area">
        <div className={styles.page}>
          {/* Hero */}
          <div className={styles.hero}>
            <div className={styles.heroStrip}>
              {swatches.map(s => (
                <span key={s.id} className={styles.heroSwatch} style={{ background: s.hex }} />
              ))}
            </div>
            <div className={styles.heroMeta}>
              <Pill icon={kindMeta.icon} label={kindMeta.label} />
              <Pill label={kindMeta.value} />
              {project && (
                <span className={styles.projectPill}>
                  <span className={styles.projectDot} style={{ background: project.colour }} />
                  {project.label}
                </span>
              )}
              <span className={styles.heroDivider} aria-hidden />
              {quality?.kind === 'tonal' && (
                <>
                  <Badge variant={ratingVariant(quality.rangeRating)} label={`Range ${quality.rangeRating}`} />
                  <Badge variant={ratingVariant(quality.evenRating)} label={`Even steps ${quality.evenRating}`} />
                </>
              )}
              {quality?.kind === 'expressive' && (
                <>
                  <Pill label={`Hue ${quality.hue}°`} />
                  <Badge variant={ratingVariant(quality.chroma)} label={`Chroma ${quality.chroma}`} />
                  <Badge variant={ratingVariant(quality.lightness)} label={`Lightness ${quality.lightness}`} />
                  {quality.near > 0 && <Badge variant="warning" label={`${quality.near} near-identical`} />}
                </>
              )}
            </div>
          </div>

          {/* Preview */}
          <Panel>
            <div className={styles.preview}>
              {groups.map(([groupKey, gs]) => {
                const heading = isTonal ? (RAMP_LABEL[groupKey] ?? groupKey) : groupNames[groupKey]
                return (
                  <div key={groupKey} className={styles.group}>
                    <div className={styles.groupName}>{heading}</div>
                    <div className={[styles.stops, isTonal ? styles.stopsTonal : styles.stopsExpressive].join(' ')}>
                      {gs.map((s, i) => {
                        const label = isTonal
                          ? TONAL_STOP_LABELS[i]
                          : i === 0
                            ? 'Light'
                            : i === gs.length - 1
                              ? 'Dark'
                              : 'Default'
                        return <Stop key={s.id} swatch={s} label={label} onPromoteClick={setPromoting} />
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </Panel>
        </div>
      </div>

      <ExportModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        title={palette.name}
        filenameBase={palette.name}
        formats={EXPORT_FORMATS}
        generate={f => exportPalette(f as ExportFormat, palette, swatches, groupNames)}
      />

      {promoting && (
        <AddColorModal
          open
          onClose={() => setPromoting(null)}
          library={library}
          fixedHex={promoting.hex}
          submitLabel="Save to library"
          onAdd={(_hex, name) => {
            handlePromote(promoting.id, name)
            setPromoting(null)
          }}
          onAddMany={() => {}}
        />
      )}
    </>
  )
}
