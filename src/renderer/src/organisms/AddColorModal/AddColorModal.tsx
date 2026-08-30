import React, { useState, useEffect, useMemo, useRef } from 'react'
import { HexColorPicker } from 'react-colorful'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faKeyboard, faImage, faCheck, faPen, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons'
import type { Colour } from '@shared/types'
import { Button } from '../../atoms/Button/Button'
import { Spinner } from '../../atoms/Spinner/Spinner'
import { Callout } from '../../molecules/Callout/Callout'
import { Tooltip } from '../../atoms/Tooltip/Tooltip'
import {
  normaliseHex,
  nearestNames,
  findSimilar,
  formatDeltaE,
  confidenceLabel,
  firstUnusedName,
} from '../../lib/colour'
import { extractDominantColours } from '../../lib/extractColours'
import Modal from '../../molecules/Modal/Modal'
import { Popover } from '../../atoms/Popover/Popover'
import { usePopover } from '../../hooks/usePopover'
import { SegmentedControl } from '../../atoms/SegmentedControl/SegmentedControl'
import styles from './AddColorModal.module.css'

interface AddColorModalProps {
  open: boolean
  onClose: () => void
  library: Colour[]
  /** May be async: the modal awaits it and only closes once the write succeeds. */
  onAdd: (hex: string, name: string) => unknown
  onAddMany: (list: Array<{ hex: string; name: string }>) => unknown
  /** Locks the colour to a fixed hex (no picker, no image tab), e.g. promoting a
   *  palette swatch to the library. */
  fixedHex?: string
  /** Override the primary-button label (default "Add colour"). */
  submitLabel?: string
}

export function AddColorModal({
  open,
  onClose,
  library,
  onAdd,
  onAddMany,
  fixedHex,
  submitLabel,
}: AddColorModalProps): React.ReactElement | null {
  const [tab, setTab] = useState<'hex' | 'image'>('hex')

  // ── From-hex state ──
  const [text, setText] = useState('')
  const [chosenName, setChosenName] = useState<string | null>(null)
  // Aliased so the picker reads as its own thing inside a component with several
  // other pieces of state.
  const { open: pickerOpen, toggle: togglePicker, close: closePicker, ref: pickerRef } = usePopover()

  // ── From-image state ──
  interface ImageRow {
    hex: string
    name: string
    included: boolean
  }
  const [preview, setPreview] = useState<string | null>(null)
  const [rows, setRows] = useState<ImageRow[]>([])
  const [editingHex, setEditingHex] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  // The write can fail: a duplicate name, a locked database. Closing on the next line
  // meant the colour silently never appeared.
  const [busy, setBusy] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const hex = useMemo(() => normaliseHex(text), [text])
  const result = useMemo(() => (hex ? nearestNames(hex, 6) : null), [hex])
  const similar = useMemo(() => (hex ? findSimilar(hex, library) : null), [hex, library])
  const existingNames = useMemo(() => new Set(library.map(c => c.name.toLowerCase())), [library])

  // Default the saved name to the best match whenever the hex changes.
  useEffect(() => {
    setChosenName(result?.best.name ?? null)
  }, [result?.best.name])

  useEffect(() => {
    if (!open) {
      setTab('hex')
      setText('')
      setChosenName(null)
      closePicker()
      setPreview(null)
      setRows([])
      setEditingHex(null)
      setLoading(false)
      setDragOver(false)
      setBusy(false)
      setSaveError(null)
    } else if (fixedHex) {
      setTab('hex')
      setText(fixedHex)
    }
  }, [open, fixedHex, closePicker])

  const dupName = chosenName ? existingNames.has(chosenName.toLowerCase()) : false
  const suggestion = result && dupName ? firstUnusedName(result, existingNames) : null

  async function addHex(): Promise<void> {
    if (!hex || !chosenName || busy) return
    setBusy(true)
    setSaveError(null)
    try {
      await onAdd(hex, chosenName)
      onClose()
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
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
    setRows(colours.map(h => ({ hex: h, name: nearestNames(h, 1).best.name, included: true })))
    setLoading(false)
  }

  function toggleRow(hex: string): void {
    setRows(prev => prev.map(r => (r.hex === hex ? { ...r, included: !r.included } : r)))
  }

  function setRowName(hex: string, name: string): void {
    setRows(prev => prev.map(r => (r.hex === hex ? { ...r, name } : r)))
  }

  async function addImage(): Promise<void> {
    if (busy) return
    setBusy(true)
    setSaveError(null)
    try {
      await onAddMany(rows.filter(r => r.included).map(r => ({ hex: r.hex, name: r.name })))
      onClose()
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  const includedCount = rows.filter(r => r.included).length

  // Count included rows per name (lowercased) to flag duplicates within the batch.
  const nameCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const r of rows) {
      if (!r.included) continue
      const key = r.name.trim().toLowerCase()
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
    return counts
  }, [rows])

  // Near-duplicate lookup per extracted hex. Depends only on the hexes + library,
  // so it doesn't re-run the O(library) ΔE scan while editing row names.
  const hexKey = rows.map(r => r.hex).join('|')
  const similarByHex = useMemo(() => {
    const map = new Map<string, ReturnType<typeof findSimilar>>()
    for (const r of rows) map.set(r.hex, findSimilar(r.hex, library))
    return map
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hexKey, library])

  const allNames = result ? [result.best, ...result.runners] : []

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={fixedHex ? 'Save to library' : 'Add colour'}
      size="lg"
      header={
        fixedHex ? undefined : (
          <SegmentedControl
            ariaLabel="Colour source"
            value={tab}
            onChange={setTab}
            options={[
              { id: 'hex', label: 'From hex', icon: faKeyboard },
              { id: 'image', label: 'From image', icon: faImage },
            ]}
          />
        )
      }
    >
      {tab === 'hex' ? (
        <div className={styles.body}>
          <div className={styles.hexRow}>
            <div className={styles.pickerWrap} ref={pickerRef}>
              <button
                type="button"
                className={styles.preview}
                style={{ background: hex ?? '#e7e7ed', cursor: fixedHex ? 'default' : 'pointer' }}
                onClick={fixedHex ? undefined : togglePicker}
                aria-label={fixedHex ? 'Swatch colour' : 'Pick a colour'}
              />
              {pickerOpen && !fixedHex && (
                <Popover align="left" pad="tight">
                  <HexColorPicker color={hex ?? '#aa1155'} onChange={setText} />
                </Popover>
              )}
            </div>
            <input
              className={styles.hexInput}
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="#hex or paste a colour"
              spellCheck={false}
              autoFocus={!fixedHex}
              readOnly={!!fixedHex}
              onKeyDown={e => {
                if (e.key === 'Enter') addHex()
              }}
            />
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
                      className={[styles.nameChip, chosenName === m.name ? styles.nameChipOn : '']
                        .filter(Boolean)
                        .join(' ')}
                      onClick={() => setChosenName(m.name)}
                    >
                      {chosenName === m.name && <FontAwesomeIcon icon={faCheck} className={styles.nameCheck} />}
                      {m.name}
                      <span className={styles.nameDelta}>ΔE {formatDeltaE(m.deltaE)}</span>
                    </button>
                  ))}
                </div>
              </div>

              {similar && (
                <Callout variant="warning">
                  Similar to <strong>{similar.name}</strong> ({similar.hex}), ΔE {formatDeltaE(similar.deltaE)}
                </Callout>
              )}
              {dupName && (
                <Callout variant="warning">
                  You already have a colour named “{chosenName}”.
                  {suggestion && (
                    <button type="button" className={styles.useInstead} onClick={() => setChosenName(suggestion.name)}>
                      Use “{suggestion.name}” instead
                    </button>
                  )}
                </Callout>
              )}
            </>
          )}

          <div className={styles.footer}>
            <Button variant="ghost" size="md" onClick={onClose}>
              Cancel
            </Button>
            {saveError && (
              <span className={styles.saveError} title={saveError}>
                {saveError}
              </span>
            )}
            <Button variant="primary" size="md" onClick={addHex} disabled={!hex || busy}>
              {busy ? 'Saving…' : (submitLabel ?? 'Add colour')}
            </Button>
          </div>
        </div>
      ) : (
        <div className={styles.body}>
          {!preview ? (
            <div
              className={[styles.dropzone, dragOver ? styles.dropzoneActive : ''].filter(Boolean).join(' ')}
              onClick={() => fileRef.current?.click()}
              onDragOver={e => {
                e.preventDefault()
                setDragOver(true)
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => {
                e.preventDefault()
                setDragOver(false)
                const f = e.dataTransfer.files[0]
                if (f) handleFile(f)
              }}
            >
              <FontAwesomeIcon icon={faImage} className={styles.dropIcon} />
              <p className={styles.dropText}>Drop an image here, or click to choose</p>
              <p className={styles.dropHint}>PNG · JPG · WEBP</p>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className={styles.fileInput}
                onChange={e => {
                  const f = e.target.files?.[0]
                  if (f) handleFile(f)
                }}
              />
            </div>
          ) : (
            <>
              <div className={styles.previewWrap}>
                <img src={preview} alt="Source" className={styles.previewImg} />
              </div>
              {loading ? (
                <div className={styles.loading}>
                  <Spinner /> Extracting…
                </div>
              ) : (
                <div className={styles.extractRows}>
                  {rows.map(r => {
                    const key = r.name.trim().toLowerCase()
                    const sim = similarByHex.get(r.hex) ?? null
                    const nameTaken = existingNames.has(key)
                    const dupInBatch = !nameTaken && r.included && (nameCounts.get(key) ?? 0) > 1
                    const warnings: string[] = []
                    if (sim) warnings.push(`Similar to “${sim.name}”, ΔE ${formatDeltaE(sim.deltaE)}`)
                    if (nameTaken) warnings.push(`You already have a colour named “${r.name}”`)
                    else if (dupInBatch) warnings.push(`Another selected row is also named “${r.name}”`)
                    return (
                      <label
                        key={r.hex}
                        className={[styles.extractRow, r.included ? '' : styles.extractRowOff]
                          .filter(Boolean)
                          .join(' ')}
                      >
                        <input
                          type="checkbox"
                          className={styles.extractCheck}
                          checked={r.included}
                          onChange={() => toggleRow(r.hex)}
                        />
                        <span className={styles.extractSwatch} style={{ background: r.hex }} />
                        <span className={styles.extractMain}>
                          {editingHex === r.hex ? (
                            <input
                              type="text"
                              autoFocus
                              className={styles.extractName}
                              value={r.name}
                              onChange={e => setRowName(r.hex, e.target.value)}
                              onBlur={() => setEditingHex(null)}
                              onFocus={e => e.target.select()}
                              onKeyDown={e => {
                                if (e.key === 'Enter' || e.key === 'Escape') (e.target as HTMLInputElement).blur()
                              }}
                            />
                          ) : (
                            <span className={styles.extractNameText}>{r.name}</span>
                          )}
                          {warnings.length > 0 && (
                            <Tooltip label={warnings.join(' · ')} align="start">
                              <span
                                className={styles.extractWarn}
                                onMouseDown={e => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                }}
                                onClick={e => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                }}
                              >
                                <FontAwesomeIcon icon={faTriangleExclamation} />
                              </span>
                            </Tooltip>
                          )}
                          {editingHex !== r.hex && (
                            <div className={styles.extractPen}>
                              <button
                                type="button"
                                className="icon-btn icon-btn--xs"
                                onMouseDown={e => e.preventDefault()}
                                onClick={e => {
                                  e.preventDefault()
                                  setEditingHex(r.hex)
                                }}
                                aria-label="Edit name"
                              >
                                <FontAwesomeIcon icon={faPen} />
                              </button>
                            </div>
                          )}
                        </span>
                        <span className={styles.extractHex}>{r.hex}</span>
                      </label>
                    )
                  })}
                </div>
              )}
            </>
          )}

          <div className={styles.footer}>
            {preview && (
              <Button
                variant="secondary"
                size="md"
                onClick={() => {
                  setPreview(null)
                  setRows([])
                }}
              >
                Choose another
              </Button>
            )}
            <div className={styles.footerRight}>
              <Button variant="ghost" size="md" onClick={onClose}>
                Cancel
              </Button>
              {saveError && (
                <span className={styles.saveError} title={saveError}>
                  {saveError}
                </span>
              )}
              <Button variant="primary" size="md" onClick={addImage} disabled={includedCount === 0 || busy}>
                Add {includedCount > 0 ? includedCount : ''} colour{includedCount === 1 ? '' : 's'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}
