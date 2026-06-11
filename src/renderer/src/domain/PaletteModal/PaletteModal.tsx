import React, { useState, useEffect, useRef, useMemo } from 'react'
import { HexColorPicker } from 'react-colorful'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark, faLock, faLockOpen, faPlus } from '@fortawesome/free-solid-svg-icons'
import type { Colour } from '@shared/types'
import { Button } from '../../atoms/Button/Button'
import { Input } from '../../atoms/Input/Input'
import { IconButton } from '../../atoms/IconButton/IconButton'
import { generateLightnessScale } from '@shared/lib/lightnessScale'
import { normaliseHex, prefersDarkText } from '../../lib/colour'
import styles from './PaletteModal.module.css'

interface PaletteModalProps {
  open: boolean
  onClose: () => void
  onCreateFromHex: (name: string, baseHex: string, swatches: string[]) => void
  onCreateFromLibrary: (name: string, hexList: string[]) => void
}

const DEFAULT_BASE = '#aa1155'
const STEPS = 10

export function PaletteModal({ open, onClose, onCreateFromHex, onCreateFromLibrary }: PaletteModalProps): React.ReactElement | null {
  const [tab, setTab] = useState<'hex' | 'library'>('hex')
  const [name, setName] = useState('')

  // From-hex state
  const [baseInput, setBaseInput] = useState(DEFAULT_BASE)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [swatches, setSwatches] = useState<string[]>(() => generateLightnessScale(DEFAULT_BASE, { steps: STEPS }))
  const [locked, setLocked] = useState<boolean[]>(() => Array(STEPS).fill(false))
  const pickerRef = useRef<HTMLDivElement>(null)

  // From-library state
  const [library, setLibrary] = useState<Colour[]>([])
  const [chosen, setChosen] = useState<Colour[]>([])
  const dragIndex = useRef<number | null>(null)

  const baseHex = useMemo(() => normaliseHex(baseInput), [baseInput])

  useEffect(() => {
    if (!open) {
      setTab('hex'); setName(''); setBaseInput(DEFAULT_BASE)
      setSwatches(generateLightnessScale(DEFAULT_BASE, { steps: STEPS }))
      setLocked(Array(STEPS).fill(false)); setPickerOpen(false); setChosen([])
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent): void => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => {
    if (open && tab === 'library' && library.length === 0) {
      window.api.colour.list().then(setLibrary)
    }
  }, [open, tab, library.length])

  // Regenerate unlocked swatches whenever the base changes (lock mechanic).
  useEffect(() => {
    if (!baseHex) return
    const scale = generateLightnessScale(baseHex, { steps: STEPS })
    setSwatches(prev => prev.map((h, i) => (locked[i] ? h : scale[i])))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseHex])

  useEffect(() => {
    if (!pickerOpen) return
    function onDown(e: MouseEvent): void {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) setPickerOpen(false)
    }
    window.addEventListener('mousedown', onDown)
    return () => window.removeEventListener('mousedown', onDown)
  }, [pickerOpen])

  function toggleLock(i: number): void {
    setLocked(prev => prev.map((l, idx) => (idx === i ? !l : l)))
  }

  function toggleChosen(colour: Colour): void {
    setChosen(prev => prev.some(c => c.id === colour.id) ? prev.filter(c => c.id !== colour.id) : [...prev, colour])
  }

  function onDrop(target: number): void {
    const from = dragIndex.current
    dragIndex.current = null
    if (from === null || from === target) return
    setChosen(prev => {
      const next = [...prev]
      const [moved] = next.splice(from, 1)
      next.splice(target, 0, moved)
      return next
    })
  }

  function create(): void {
    const trimmed = name.trim() || 'Untitled palette'
    if (tab === 'hex' && baseHex) {
      onCreateFromHex(trimmed, baseHex, swatches)
    } else if (tab === 'library' && chosen.length > 0) {
      onCreateFromLibrary(trimmed, chosen.map(c => c.hex))
    }
    onClose()
  }

  if (!open) return null
  const canCreate = tab === 'hex' ? baseHex !== null : chosen.length > 0

  return (
    <div className={styles.overlay} role="dialog" aria-modal aria-label="New palette">
      <div className={styles.modal}>
        <div className={styles.header}>
          <div className={styles.tabs}>
            <button type="button" className={[styles.tab, tab === 'hex' ? styles.tabOn : ''].filter(Boolean).join(' ')} onClick={() => setTab('hex')}>Generate from hex</button>
            <button type="button" className={[styles.tab, tab === 'library' ? styles.tabOn : ''].filter(Boolean).join(' ')} onClick={() => setTab('library')}>From library</button>
          </div>
          <IconButton label="Close" onClick={onClose}><FontAwesomeIcon icon={faXmark} /></IconButton>
        </div>

        <div className={styles.body}>
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="Palette name" autoFocus />

          {tab === 'hex' ? (
            <>
              <div className={styles.hexRow}>
                <div className={styles.pickerWrap} ref={pickerRef}>
                  <button type="button" className={styles.preview} style={{ background: baseHex ?? '#e7e7ed' }} onClick={() => setPickerOpen(o => !o)} aria-label="Pick base colour" />
                  {pickerOpen && <div className={styles.popover}><HexColorPicker color={baseHex ?? DEFAULT_BASE} onChange={setBaseInput} /></div>}
                </div>
                <input className={styles.hexInput} value={baseInput} onChange={e => setBaseInput(e.target.value)} placeholder="#hex" spellCheck={false} />
              </div>

              <div className={styles.scale}>
                {swatches.map((hex, i) => (
                  <button
                    key={i}
                    type="button"
                    className={styles.scaleSwatch}
                    style={{ background: hex, color: prefersDarkText(hex) ? '#000' : '#fff' }}
                    onClick={() => toggleLock(i)}
                    aria-label={locked[i] ? `Unlock swatch ${i + 1}` : `Lock swatch ${i + 1}`}
                    title={hex}
                  >
                    <FontAwesomeIcon icon={locked[i] ? faLock : faLockOpen} className={[styles.lockIcon, locked[i] ? styles.lockOn : ''].filter(Boolean).join(' ')} />
                  </button>
                ))}
              </div>
              <p className={styles.hint}>Click a swatch to lock it — changing the base keeps locked swatches.</p>
            </>
          ) : (
            <div className={styles.libraryBody}>
              {chosen.length > 0 && (
                <div className={styles.chosen}>
                  {chosen.map((c, i) => (
                    <div
                      key={c.id}
                      className={styles.chosenItem}
                      draggable
                      onDragStart={() => { dragIndex.current = i }}
                      onDragOver={e => e.preventDefault()}
                      onDrop={() => onDrop(i)}
                      style={{ background: c.hex, color: prefersDarkText(c.hex) ? '#000' : '#fff' }}
                      title={`${c.name} · drag to reorder`}
                    >
                      {c.hex}
                    </div>
                  ))}
                </div>
              )}
              <div className={styles.libraryLabel}>Your colours</div>
              {library.length === 0 ? (
                <p className={styles.hint}>No saved colours yet. Add some in the Colors section first.</p>
              ) : (
                <div className={styles.libraryGrid}>
                  {library.map(c => {
                    const on = chosen.some(x => x.id === c.id)
                    return (
                      <button key={c.id} type="button" className={[styles.libSwatch, on ? styles.libSwatchOn : ''].filter(Boolean).join(' ')} style={{ background: c.hex }} onClick={() => toggleChosen(c)} title={c.name}>
                        {on && <FontAwesomeIcon icon={faPlus} className={styles.libCheck} style={{ color: prefersDarkText(c.hex) ? '#000' : '#fff' }} />}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <Button variant="ghost" size="md" onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="md" onClick={create} disabled={!canCreate}>Create palette</Button>
        </div>
      </div>
    </div>
  )
}
