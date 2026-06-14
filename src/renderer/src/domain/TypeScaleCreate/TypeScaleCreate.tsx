import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronLeft, faCode, faShapes } from '@fortawesome/free-solid-svg-icons'
import type { Font, Tag, TagWithCount, TypeScale, TypeScaleStepInput, TypeScaleStepName, TypeScaleKind } from '@shared/types'
import { generateTypeScaleSteps, RATIO_PRESETS, KIND_LABELS } from '@shared/lib/typeScale'
import { fontStackById } from '../../lib/fontLoader'
import { TAG_COLOURS } from '../../lib/tagColours'
import { Toolbar } from '../../primitives/Toolbar/Toolbar'
import { Button } from '../../atoms/Button/Button'
import { Input } from '../../atoms/Input/Input'
import { IconButton } from '../../atoms/IconButton/IconButton'
import { SegmentedControl } from '../../atoms/SegmentedControl/SegmentedControl'
import { Select } from '../../primitives/Select/Select'
import { TagSelect } from '../TagSelect/TagSelect'
import { SpecimenTable } from '../SpecimenTable/SpecimenTable'
import { UnitsControl } from '../UnitsControl/UnitsControl'
import { StepEditControl } from '../StepEditControl/StepEditControl'
import { type TypeUnits, DEFAULT_UNITS } from '../../lib/typeUnits'
import styles from './TypeScaleCreate.module.css'

interface TypeScaleCreateProps {
  fonts: Font[]
  onCancel: () => void
  onCreate: (
    name: string,
    headingFontId: number | null,
    bodyFontId: number | null,
    baseSize: number,
    ratio: string,
    steps: TypeScaleStepInput[],
  ) => Promise<TypeScale>
}

const KIND_OPTIONS: Array<{ id: TypeScaleKind; label: string; icon: typeof faCode }> = [
  { id: 'semantic', label: KIND_LABELS.semantic, icon: faShapes },
  { id: 'markup', label: KIND_LABELS.markup, icon: faCode },
]

const DEFAULT_RATIO = 1.333

export function TypeScaleCreate({ fonts, onCancel, onCreate }: TypeScaleCreateProps): React.ReactElement {
  const [name, setName] = useState('')

  // Project scope
  const [projects, setProjects] = useState<TagWithCount[]>([])
  const [projectId, setProjectId] = useState<number | null>(null)
  const [projectFontIds, setProjectFontIds] = useState<Set<number> | null>(null)

  const [kind, setKind] = useState<TypeScaleKind>('semantic')
  const [headingFontId, setHeadingFontId] = useState<number | null>(null)
  const [bodyFontId, setBodyFontId] = useState<number | null>(null)
  const [baseSize, setBaseSize] = useState(16)
  const [ratio, setRatio] = useState(DEFAULT_RATIO)
  const [steps, setSteps] = useState<TypeScaleStepInput[]>(() => generateTypeScaleSteps(16, DEFAULT_RATIO, 'semantic'))

  const [preview, setPreview] = useState('The quick brown fox jumps over the lazy dog')
  const [units, setUnits] = useState<TypeUnits>(DEFAULT_UNITS)

  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load projects (tags) once.
  useEffect(() => { window.api.tag.list().then(setProjects) }, [])

  // Load the chosen project's font membership.
  useEffect(() => {
    if (projectId == null) { setProjectFontIds(null); return }
    let live = true
    window.api.tag.listAssetIds('font', projectId).then(ids => { if (live) setProjectFontIds(new Set(ids)) })
    return () => { live = false }
  }, [projectId])

  // Regenerate the scale whenever base size, ratio, or preset kind changes.
  useEffect(() => { setSteps(generateTypeScaleSteps(baseSize, ratio, kind)) }, [baseSize, ratio, kind])

  // Fonts scoped to the selected project.
  const scopedFonts = useMemo(
    () => (projectFontIds ? fonts.filter(f => projectFontIds.has(f.id)) : []),
    [fonts, projectFontIds]
  )

  // Keep the heading/body selections valid as the scope changes.
  useEffect(() => {
    setHeadingFontId(prev => (scopedFonts.some(f => f.id === prev) ? prev : (scopedFonts[0]?.id ?? null)))
    setBodyFontId(prev => (prev != null && scopedFonts.some(f => f.id === prev) ? prev : null))
  }, [scopedFonts])

  const selectProject = useCallback((t: Tag): void => {
    setProjectId(prev => (prev === t.id ? null : t.id))
  }, [])

  const createProject = useCallback(async (label: string): Promise<void> => {
    const created = await window.api.tag.create(label, TAG_COLOURS[0])
    setProjects(prev => [...prev, created].sort((a, b) => a.label.localeCompare(b.label)))
    setProjectId(created.id)
  }, [])

  const headingStack = useMemo(() => fontStackById(headingFontId, fonts), [headingFontId, fonts])
  const bodyStack = useMemo(() => fontStackById(bodyFontId ?? headingFontId, fonts), [bodyFontId, headingFontId, fonts])

  // Per-step tuning (hover-edit in the preview). Deviating from the ramp makes it "Custom".
  function editStep(name: TypeScaleStepName, size: number, weight: number, lineHeight: string, letterSpacing: string): void {
    setSteps(prev => prev.map(s => (s.step_name === name ? { ...s, size, weight, line_height: lineHeight, letter_spacing: letterSpacing } : s)))
  }

  const canCreate = name.trim().length > 0 && headingFontId != null

  async function create(): Promise<void> {
    const trimmed = name.trim()
    if (!trimmed || headingFontId == null) return
    setCreating(true)
    setError(null)
    try {
      const scale = await onCreate(trimmed, headingFontId, bodyFontId, baseSize, String(ratio), steps)
      // Auto-join the new scale to the project its fonts came from.
      if (projectId != null) await window.api.tag.assign('type_scale', scale.id, projectId)
      onCancel()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setCreating(false)
    }
  }

  return (
    <>
      <Toolbar
        title={
          <span className={styles.titleRow}>
            <IconButton label="Back to type scales" onClick={onCancel}>
              <FontAwesomeIcon icon={faChevronLeft} />
            </IconButton>
            New type scale
          </span>
        }
        actions={
          <>
            {error && <span className={styles.error} title={error}>{error}</span>}
            <Button variant="ghost" size="md" onClick={onCancel}>Cancel</Button>
            <Button variant="primary" size="md" onClick={create} disabled={!canCreate || creating}>
              {creating ? 'Creating…' : 'Create type scale'}
            </Button>
          </>
        }
      />

      <div className={styles.panes}>
        {/* ── Controls ── */}
        <div className={styles.controls}>
          {/* 1 — Name */}
          <div className={styles.field}>
            <label className={styles.label}>Name <span className={styles.req}>*</span></label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Type scale name" autoFocus />
          </div>

          {/* 2 — Preset kind */}
          <div className={styles.field}>
            <label className={styles.label}>Type</label>
            <SegmentedControl ariaLabel="Scale type" value={kind} onChange={setKind} options={KIND_OPTIONS} />
          </div>

          {/* 3 — Project */}
          <div className={styles.field}>
            <label className={styles.label}>Project</label>
            <TagSelect
              allTags={projects}
              selectedIds={projectId != null ? new Set([projectId]) : new Set()}
              onToggle={selectProject}
              onCreateNew={createProject}
              single
              placeholder="Choose a project…"
            />
          </div>

          {/* 4 — Fonts (scoped to project) */}
          {projectId == null ? (
            <p className={styles.empty}>Choose a project to pick its heading &amp; body fonts.</p>
          ) : scopedFonts.length === 0 ? (
            <p className={styles.empty}>This project has no fonts yet. Add fonts to it from the Fonts page.</p>
          ) : (
            <>
              <div className={styles.field}>
                <label className={styles.label}>Heading font</label>
                <Select
                  block
                  ariaLabel="Heading font"
                  value={headingFontId != null ? String(headingFontId) : ''}
                  options={scopedFonts.map(f => ({ key: String(f.id), label: f.family }))}
                  onChange={k => setHeadingFontId(Number(k))}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Body font</label>
                <Select
                  block
                  ariaLabel="Body font"
                  value={bodyFontId != null ? String(bodyFontId) : ''}
                  options={[{ key: '', label: 'Same as heading' }, ...scopedFonts.map(f => ({ key: String(f.id), label: f.family }))]}
                  onChange={k => setBodyFontId(k ? Number(k) : null)}
                />
              </div>
            </>
          )}

          {/* 5 — Base size */}
          <div className={styles.field}>
            <label className={styles.label}>Base size</label>
            <div className={styles.sizeInput}>
              <input
                type="number"
                min={10}
                max={24}
                value={baseSize}
                onChange={e => setBaseSize(Number(e.target.value) || 16)}
                className={styles.numInput}
              />
              <span className={styles.unit}>px</span>
            </div>
          </div>

          {/* 6 — Ratio presets */}
          <div className={styles.field}>
            <label className={styles.label}>Ratio</label>
            <div className={styles.ratios}>
              {RATIO_PRESETS.map(p => (
                <button
                  key={p.value}
                  type="button"
                  className={[styles.ratio, ratio === p.value ? styles.ratioOn : ''].filter(Boolean).join(' ')}
                  onClick={() => setRatio(p.value)}
                >
                  <span className={styles.ratioName}>{p.name}{p.recommended && <span className={styles.rec}>★</span>}</span>
                  <span className={styles.ratioVal}>{p.value}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Preview ── */}
        <div className={styles.previewPane}>
          {headingFontId == null ? (
            <div className={styles.previewEmpty}>
              {projectId == null
                ? 'Choose a project and its fonts to preview the scale.'
                : 'This project has no fonts yet — add some to preview the scale.'}
            </div>
          ) : (
            <>
              <div className={styles.previewHead}>
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
                renderTrailing={step => (
                  <StepEditControl
                    size={step.size}
                    weight={step.weight}
                    lineHeight={step.line_height}
                    letterSpacing={step.letter_spacing}
                    onChange={(size, weight, lh, ls) => editStep(step.step_name, size, weight, lh, ls)}
                  />
                )}
              />
            </>
          )}
        </div>
      </div>
    </>
  )
}
