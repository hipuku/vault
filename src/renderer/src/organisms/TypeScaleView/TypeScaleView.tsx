import React, { useState, useEffect, useMemo } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronLeft, faTrash, faFileExport, faTextHeight } from '@fortawesome/free-solid-svg-icons'
import type { TypeScale, TypeScaleStep, Tag } from '@shared/types'
import { RATIO_PRESETS, isCustomScale } from '@shared/lib/typeScale'
import { Toolbar } from '../../molecules/Toolbar/Toolbar'
import { Button } from '../../atoms/Button/Button'
import { Input } from '../../atoms/Input/Input'
import { IconButton } from '../../atoms/IconButton/IconButton'
import { Panel } from '../../atoms/Panel/Panel'
import { Pill } from '../../atoms/Pill/Pill'
import { Badge } from '../../atoms/Badge/Badge'
import { EditableName } from '../../atoms/EditableName/EditableName'
import { ExportModal } from '../../organisms/ExportModal/ExportModal'
import { SpecimenTable } from '../../organisms/SpecimenTable/SpecimenTable'
import { UnitsControl } from '../../molecules/UnitsControl/UnitsControl'
import { TYPE_EXPORT_FORMATS, exportTypeScale } from '../../lib/typeScaleExport'
import { type TypeUnits, DEFAULT_UNITS } from '../../lib/typeUnits'
import styles from './TypeScaleView.module.css'

interface TypeScaleViewProps {
  scale: TypeScale
  steps: TypeScaleStep[]
  headingStack: string
  bodyStack: string
  headingFamily: string | null
  bodyFamily: string | null
  onBack: () => void
  onRename: (id: number, name: string) => void
  onDelete: (scale: TypeScale) => void
}

const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const LOWER = 'abcdefghijklmnopqrstuvwxyz'
const DIGITS = '0123456789'

export function TypeScaleView({
  scale,
  steps,
  headingStack,
  bodyStack,
  headingFamily,
  bodyFamily,
  onBack,
  onRename,
  onDelete,
}: TypeScaleViewProps): React.ReactElement {
  const [project, setProject] = useState<Tag | null>(null)
  const [exportOpen, setExportOpen] = useState(false)
  const [preview, setPreview] = useState('The quick brown fox jumps over the lazy dog')
  const [units, setUnits] = useState<TypeUnits>(DEFAULT_UNITS)

  useEffect(() => {
    let live = true
    window.api.tag.listForAsset('type_scale', scale.id).then(mine => {
      if (live) setProject(mine[0] ?? null) // type scales belong to exactly one project
    })
    return () => {
      live = false
    }
  }, [scale.id])

  // A hand-tuned scale no longer maps to a named ratio — show "Custom" instead.
  const custom = useMemo(
    () => isCustomScale(steps, scale.base_size, parseFloat(scale.ratio)),
    [steps, scale.base_size, scale.ratio],
  )
  const ratioName = useMemo(
    () => RATIO_PRESETS.find(p => String(p.value) === scale.ratio)?.name ?? scale.ratio,
    [scale.ratio],
  )

  // Hero specimen — the family (or both families) shown as a glyph specimen.
  const specimenFonts = useMemo(() => {
    const head = { role: 'Heading', family: headingFamily ?? 'System', stack: headingStack }
    if (bodyFamily && bodyFamily !== headingFamily) {
      return [head, { role: 'Body', family: bodyFamily, stack: bodyStack }]
    }
    return [{ role: null, family: headingFamily ?? 'System', stack: headingStack }]
  }, [headingFamily, bodyFamily, headingStack, bodyStack])

  // Quality signals (§5.4) — legibility checks on the body step (preset-agnostic).
  const quality = useMemo(() => {
    const body = steps.find(s => s.step_name === 'Body' || s.step_name === 'Paragraph')
    if (!body) return null
    const lh = parseFloat(body.line_height)
    return {
      sizeOk: body.size >= 16,
      bodySize: body.size,
      leadingOk: !Number.isNaN(lh) && lh >= 1.4 && lh <= 1.6,
      leading: body.line_height,
    }
  }, [steps])

  return (
    <>
      <Toolbar
        title={
          <span className={styles.titleRow}>
            <IconButton label="Back to type scales" onClick={onBack}>
              <FontAwesomeIcon icon={faChevronLeft} />
            </IconButton>
            <EditableName value={scale.name} onCommit={n => onRename(scale.id, n)} ariaLabel="type scale name" />
          </span>
        }
        actions={
          <>
            <Button variant="secondary" size="md" onClick={() => setExportOpen(true)}>
              <FontAwesomeIcon icon={faFileExport} /> Export
            </Button>
            <Button variant="danger" size="md" onClick={() => onDelete(scale)}>
              <FontAwesomeIcon icon={faTrash} /> Delete
            </Button>
          </>
        }
      />

      <div className="scroll-area">
        <div className={styles.page}>
          {/* Hero — font specimen */}
          <div className={styles.hero}>
            <div
              className={styles.heroBanner}
              style={{ gridTemplateColumns: `repeat(${specimenFonts.length}, minmax(0, 1fr))` }}
            >
              {specimenFonts.map((f, i) => (
                <div key={i} className={styles.specimenCol}>
                  {f.role && <span className={styles.specimenRole}>{f.role}</span>}
                  <span className={styles.specimenFamily} style={{ fontFamily: f.stack }}>
                    {f.family}
                  </span>
                  <span className={styles.specimenGlyphs} style={{ fontFamily: f.stack }}>
                    {UPPER}
                  </span>
                  <span className={styles.specimenGlyphs} style={{ fontFamily: f.stack }}>
                    {LOWER}
                  </span>
                  <span className={styles.specimenGlyphs} style={{ fontFamily: f.stack }}>
                    {DIGITS}
                  </span>
                </div>
              ))}
            </div>
            <div className={styles.heroMeta}>
              <Pill icon={faTextHeight} label={`${steps.length} steps`} />
              <Pill label={custom ? 'Custom' : ratioName} />
              <Pill label={`${scale.base_size}px base`} />
              {project && (
                <span className={styles.projectPill}>
                  <span className={styles.projectDot} style={{ background: project.colour }} />
                  {project.label}
                </span>
              )}
              {quality && (
                <>
                  <span className={styles.heroDivider} aria-hidden />
                  <Badge variant={quality.sizeOk ? 'success' : 'warning'} label={`Body ${quality.bodySize}px`} />
                  <Badge variant={quality.leadingOk ? 'success' : 'warning'} label={`Leading ${quality.leading}`} />
                </>
              )}
            </div>
          </div>

          {/* Specimen */}
          <Panel title="Specimen">
            <div className={styles.specimenHead}>
              <Input
                className={styles.previewField}
                value={preview}
                onChange={e => setPreview(e.target.value)}
                aria-label="Preview text"
                placeholder="Preview text…"
                spellCheck={false}
              />
              <UnitsControl units={units} onChange={setUnits} />
            </div>
            <SpecimenTable
              steps={steps}
              headingStack={headingStack}
              bodyStack={bodyStack}
              previewText={preview}
              units={units}
            />
          </Panel>
        </div>
      </div>

      <ExportModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        title={scale.name}
        filenameBase={scale.name}
        formats={TYPE_EXPORT_FORMATS}
        generate={f => exportTypeScale(f, steps, units)}
      />
    </>
  )
}
