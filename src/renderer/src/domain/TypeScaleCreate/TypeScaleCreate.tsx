import React, { useState, useMemo, useEffect } from 'react'
import type { Font, TypeScaleStepInput, TypeScaleStepName } from '@shared/types'
import { generateTypeScaleSteps, RATIO_PRESETS } from '@shared/lib/typeScale'
import { categoryGeneric } from '../../lib/fontLoader'
import { Button } from '../../atoms/Button/Button'
import { Input } from '../../atoms/Input/Input'
import { SpecimenTable, type PreviewMode } from '../SpecimenTable/SpecimenTable'
import { StepEditControl } from '../StepEditControl/StepEditControl'
import styles from './TypeScaleCreate.module.css'

interface TypeScaleCreateProps {
  fonts: Font[]
  onCancel: () => void
  onSave: (name: string, headingFontId: number | null, bodyFontId: number | null, baseSize: number, ratio: string, steps: TypeScaleStepInput[]) => void
}

function stackFor(fontId: number | null, fonts: Font[]): string {
  const f = fonts.find(x => x.id === fontId)
  return f ? `'${f.family}', ${categoryGeneric(f.category)}` : 'system-ui, sans-serif'
}

const MODES: Array<{ key: PreviewMode; label: string }> = [
  { key: 'role', label: 'By role' },
  { key: 'heading', label: 'Heading' },
  { key: 'body', label: 'Body' },
]

export function TypeScaleCreate({ fonts, onCancel, onSave }: TypeScaleCreateProps): React.ReactElement {
  const [name, setName] = useState('')
  const [headingFontId, setHeadingFontId] = useState<number | null>(fonts[0]?.id ?? null)
  const [bodyFontId, setBodyFontId] = useState<number | null>(null)
  const [baseSize, setBaseSize] = useState(16)
  const [ratio, setRatio] = useState(1.333)
  const [steps, setSteps] = useState<TypeScaleStepInput[]>(() => generateTypeScaleSteps(16, 1.333))
  const [preview, setPreview] = useState('The quick brown fox jumps over the lazy dog')
  const [mode, setMode] = useState<PreviewMode>('role')

  // Regenerate the scale whenever base size or ratio changes (resets per-step edits).
  useEffect(() => { setSteps(generateTypeScaleSteps(baseSize, ratio)) }, [baseSize, ratio])

  const headingStack = useMemo(() => stackFor(headingFontId, fonts), [headingFontId, fonts])
  const bodyStack = useMemo(() => stackFor(bodyFontId ?? headingFontId, fonts), [bodyFontId, headingFontId, fonts])

  function editStep(stepName: TypeScaleStepName, size: number, weight: number, lineHeight: string, letterSpacing: string): void {
    setSteps(prev => prev.map(s => (s.step_name === stepName ? { ...s, size, weight, line_height: lineHeight, letter_spacing: letterSpacing } : s)))
  }

  function save(): void {
    onSave(name.trim() || 'Untitled scale', headingFontId, bodyFontId, baseSize, String(ratio), steps)
  }

  if (fonts.length === 0) {
    return (
      <div className={styles.empty}>
        <p className={styles.emptyTitle}>Add a font first</p>
        <p className={styles.emptyText}>Type scales pull from your font library. Add at least one font in the Fonts section.</p>
        <Button variant="secondary" size="md" onClick={onCancel}>Back</Button>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.bar}>
        <Input value={name} onChange={e => setName(e.target.value)} placeholder="Type scale name" autoFocus className={styles.nameInput} />
        <div className={styles.barActions}>
          <Button variant="ghost" size="md" onClick={onCancel}>Cancel</Button>
          <Button variant="primary" size="md" onClick={save} disabled={headingFontId === null}>Save type scale</Button>
        </div>
      </div>

      <div className={styles.scroll}>
        <div className={styles.controls}>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>Heading font</label>
            <select className={styles.select} value={headingFontId ?? ''} onChange={e => setHeadingFontId(Number(e.target.value))}>
              {fonts.map(f => <option key={f.id} value={f.id}>{f.family}</option>)}
            </select>
          </div>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>Body font</label>
            <select className={styles.select} value={bodyFontId ?? ''} onChange={e => setBodyFontId(e.target.value ? Number(e.target.value) : null)}>
              <option value="">Same as heading</option>
              {fonts.map(f => <option key={f.id} value={f.id}>{f.family}</option>)}
            </select>
          </div>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>Base size</label>
            <div className={styles.sizeInput}>
              <input type="number" min={10} max={24} value={baseSize} onChange={e => setBaseSize(Number(e.target.value) || 16)} className={styles.numInput} />
              <span className={styles.unit}>px</span>
            </div>
          </div>
        </div>

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

        <div className={styles.specimenHead}>
          <input className={styles.previewInput} value={preview} onChange={e => setPreview(e.target.value)} aria-label="Preview text" />
          <div className={styles.modeToggle}>
            {MODES.map(m => (
              <button key={m.key} type="button" className={[styles.mode, mode === m.key ? styles.modeOn : ''].filter(Boolean).join(' ')} onClick={() => setMode(m.key)}>{m.label}</button>
            ))}
          </div>
        </div>

        <SpecimenTable
          steps={steps}
          headingStack={headingStack}
          bodyStack={bodyStack}
          previewText={preview}
          mode={mode}
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
      </div>
    </div>
  )
}
