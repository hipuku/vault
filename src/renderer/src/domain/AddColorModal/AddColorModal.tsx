import React, { useState, useEffect, useMemo, useRef } from 'react'
import { HexColorPicker } from 'react-colorful'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark, faKeyboard, faImage, faTriangleExclamation, faCheck } from '@fortawesome/free-solid-svg-icons'
import type { Colour } from '@shared/types'
import { Button } from '../../atoms/Button/Button'
import { IconButton } from '../../atoms/IconButton/IconButton'
import { Spinner } from '../../atoms/Spinner/Spinner'
import { ContrastBadges } from '../ContrastBadges/ContrastBadges'
import {
  normaliseHex, nearestNames, findSimilar, formatDeltaE, confidenceLabel, firstUnusedName, prefersDarkText,
} from '../../lib/colour'
import { extractDominantColours } from '../../lib/extractColours'
import styles from './AddColorModal.module.css'

interface AddColorModalProps {
  open: boolean
  onClose: () => void
  library: Colour[]
  onAdd: (hex: string, name: string) => void
  onAddMany: (list: Array<{ hex: string; name: string }>) => void
}

export function AddColorModal({ open, onClose, library, onAdd, onAddMany }: AddColorModalProps): React.ReactElement | null {
  const [tab, setTab] = useState<'hex' | 'image'>('hex')

  // ── From-hex state ──
  const [text, setText] = useState('')
  const [pickerOpen, setPickerOpen] = useState(false)
  const [chosenName, setChosenName] = useState<string | null>(null)
  const pickerRef = useRef<HTMLDivElement>(null)

  // ── From-image state ──
  const [preview, setPreview] = useState<string | null>(null)
  const [swatches, setSwatches] = useState<string[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const hex = useMemo(() => normaliseHex(text), [text])
  const result = useMemo(() => (hex ? nearestNames(hex, 6) : null), [hex])
  const similar = useMemo(() => (hex ? findSimilar(hex, library) : null), [hex, library])
  const existingNames = useMemo(() => new Set(library.map(c => c.name.toLowerCase())), [library])

  // Default the saved name to the best match whenever the hex changes.
  useEffect(() => { setChosenName(result?.best.name ?? null) }, [result?.best.name])

  useEffect(() => {
    if (!open) {
      setTab('hex'); setText(''); setChosenName(null); setPickerOpen(false)
      setPreview(null); setSwatches([]); setSelected(new Set()); setLoading(false); setDragOver(false)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent): void => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => {
    if (!pickerOpen) return
    function onDown(e: MouseEvent): void { if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) setPickerOpen(false) }
    window.addEventListener('mousedown', onDown)
    return () => window.removeEventListener('mousedown', onDown)
  }, [pickerOpen])

  const dupName = chosenName ? existingNames.has(chosenName.toLowerCase()) : false
  const suggestion = result && dupName ? firstUnusedName(result, existingNames) : null

  function addHex(): void {
    if (!hex || !chosenName) return
    onAdd(hex, chosenName)
    onClose()
  }

  async function handleFile(file: File): Promise<void> {
    if (!file.type.startsWith('image/')) return
    setLoading(true)
    const dataUrl = await new Promise<string>(resolve => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.readAsDataURL(file)
    })
    setPreview(dataUrl)
    const colours = await extractDominantColours(dataUrl, 8)
    setSwatches(colours)
    setSelected(new Set(colours))
    setLoading(false)
  }

  function addImage(): void {
    const chosen = swatches.filter(h => selected.has(h))
    onAddMany(chosen.map(h => ({ hex: h, name: nearestNames(h, 1).best.name })))
    onClose()
  }

  if (!open) return null

  const allNames = result ? [result.best, ...result.runners] : []

  return (
    <div className={styles.overlay} role="dialog" aria-modal aria-label="Add colour">
      <div className={styles.modal}>
        <div className={styles.header}>
          <div className={styles.tabs}>
            <button type="button" className={[styles.tab, tab === 'hex' ? styles.tabOn : ''].filter(Boolean).join(' ')} onClick={() => setTab('hex')}>
              <FontAwesomeIcon icon={faKeyboard} /> From hex
            </button>
            <button type="button" className={[styles.tab, tab === 'image' ? styles.tabOn : ''].filter(Boolean).join(' ')} onClick={() => setTab('image')}>
              <FontAwesomeIcon icon={faImage} /> From image
            </button>
          </div>
          <IconButton label="Close" onClick={onClose}><FontAwesomeIcon icon={faXmark} /></IconButton>
        </div>

        {tab === 'hex' ? (
          <div className={styles.body}>
            <div className={styles.hexRow}>
              <div className={styles.pickerWrap} ref={pickerRef}>
                <button type="button" className={styles.preview} style={{ background: hex ?? '#e7e7ed' }} onClick={() => setPickerOpen(o => !o)} aria-label="Pick a colour" />
                {pickerOpen && <div className={styles.popover}><HexColorPicker color={hex ?? '#aa1155'} onChange={setText} /></div>}
              </div>
              <input className={styles.hexInput} value={text} onChange={e => setText(e.target.value)} placeholder="#hex or paste a colour" spellCheck={false} autoFocus onKeyDown={e => { if (e.key === 'Enter') addHex() }} />
            </div>

            {hex && result && (
              <>
                <div className={styles.section}>
                  <div className={styles.sectionHead}>
                    <span className={styles.sectionLabel}>Name</span>
                    <span className={styles.confidence}>{confidenceLabel(result.confidence)}</span>
                  </div>
                  <div className={styles.names}>
                    {allNames.map(m => (
                      <button
                        key={m.name + m.hex}
                        type="button"
                        className={[styles.nameChip, chosenName === m.name ? styles.nameChipOn : ''].filter(Boolean).join(' ')}
                        onClick={() => setChosenName(m.name)}
                      >
                        {chosenName === m.name && <FontAwesomeIcon icon={faCheck} className={styles.nameCheck} />}
                        {m.name}
                        <span className={styles.nameDelta}>ΔE {formatDeltaE(m.deltaE)}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className={styles.section}>
                  <span className={styles.sectionLabel}>Contrast</span>
                  <ContrastBadges hex={hex} />
                </div>

                {similar && (
                  <p className={styles.warn}>
                    <FontAwesomeIcon icon={faTriangleExclamation} className={styles.warnIcon} />
                    Similar to <strong>{similar.name}</strong> ({similar.hex}) — ΔE {formatDeltaE(similar.deltaE)}
                  </p>
                )}
                {dupName && (
                  <p className={styles.warn}>
                    <FontAwesomeIcon icon={faTriangleExclamation} className={styles.warnIcon} />
                    You already have a colour named “{chosenName}”.
                    {suggestion && (
                      <button type="button" className={styles.useInstead} onClick={() => setChosenName(suggestion.name)}>Use “{suggestion.name}” instead</button>
                    )}
                  </p>
                )}
              </>
            )}

            <div className={styles.footer}>
              <Button variant="ghost" size="md" onClick={onClose}>Cancel</Button>
              <Button variant="primary" size="md" onClick={addHex} disabled={!hex}>Add colour</Button>
            </div>
          </div>
        ) : (
          <div className={styles.body}>
            {!preview ? (
              <div
                className={[styles.dropzone, dragOver ? styles.dropzoneActive : ''].filter(Boolean).join(' ')}
                onClick={() => fileRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
              >
                <FontAwesomeIcon icon={faImage} className={styles.dropIcon} />
                <p className={styles.dropText}>Drop an image here, or click to choose</p>
                <p className={styles.dropHint}>PNG · JPG · WEBP</p>
                <input ref={fileRef} type="file" accept="image/*" className={styles.fileInput} onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
              </div>
            ) : (
              <>
                <div className={styles.previewWrap}><img src={preview} alt="Source" className={styles.previewImg} /></div>
                {loading ? (
                  <div className={styles.loading}><Spinner /> Extracting…</div>
                ) : (
                  <div className={styles.swatchGrid}>
                    {swatches.map(h => {
                      const on = selected.has(h)
                      return (
                        <button key={h} type="button" className={[styles.swatch, on ? styles.swatchOn : ''].filter(Boolean).join(' ')} onClick={() => setSelected(prev => { const n = new Set(prev); n.has(h) ? n.delete(h) : n.add(h); return n })}>
                          <span className={styles.swatchBlock} style={{ background: h }}>
                            {on && <FontAwesomeIcon icon={faCheck} className={styles.swatchCheck} style={{ color: prefersDarkText(h) ? '#000' : '#fff' }} />}
                          </span>
                          <span className={styles.swatchHex}>{h}</span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </>
            )}

            <div className={styles.footer}>
              {preview && <Button variant="ghost" size="md" onClick={() => { setPreview(null); setSwatches([]); setSelected(new Set()) }}>Choose another</Button>}
              <div className={styles.footerRight}>
                <Button variant="ghost" size="md" onClick={onClose}>Cancel</Button>
                <Button variant="primary" size="md" onClick={addImage} disabled={selected.size === 0}>
                  Add {selected.size > 0 ? selected.size : ''} colour{selected.size === 1 ? '' : 's'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
