import React, { useState, useEffect, useMemo, useRef } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark, faMagnifyingGlass, faUpload, faCheck, faLaptop } from '@fortawesome/free-solid-svg-icons'
import type { GoogleFontMeta, LocalFontFile, InstalledFamily } from '@shared/types'
import { Button } from '../../atoms/Button/Button'
import { Input } from '../../atoms/Input/Input'
import { Spinner } from '../../atoms/Spinner/Spinner'
import { SegmentedControl } from '../../atoms/SegmentedControl/SegmentedControl'
import { Select } from '../../molecules/Select/Select'
import {
  loadGoogleFont,
  loadPreviewFont,
  familyFromFilename,
  categoryGeneric,
  detectWeightStyle,
} from '../../lib/fontLoader'
import Modal from '../../molecules/Modal/Modal'
import styles from './FontAdder.module.css'

interface FontAdderProps {
  open: boolean
  onClose: () => void
  existing: Set<string>
  /** Both may be async: the adder awaits them and surfaces a failure rather than
   *  closing as though it worked. */
  onAddGoogle: (meta: GoogleFontMeta) => unknown
  onAddLocal: (family: string, files: LocalFontFile[]) => unknown
}

let googleCache: GoogleFontMeta[] | null = null

type CategoryId = 'all' | 'sans-serif' | 'serif' | 'display' | 'handwriting' | 'monospace'
const CATEGORIES: Array<{ id: CategoryId; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'sans-serif', label: 'Sans' },
  { id: 'serif', label: 'Serif' },
  { id: 'display', label: 'Display' },
  { id: 'handwriting', label: 'Script' },
  { id: 'monospace', label: 'Mono' },
]

const WEIGHTS: Array<{ value: number; label: string }> = [
  { value: 100, label: 'Thin 100' },
  { value: 200, label: 'ExtraLight 200' },
  { value: 300, label: 'Light 300' },
  { value: 400, label: 'Regular 400' },
  { value: 500, label: 'Medium 500' },
  { value: 600, label: 'SemiBold 600' },
  { value: 700, label: 'Bold 700' },
  { value: 800, label: 'ExtraBold 800' },
  { value: 900, label: 'Black 900' },
]

interface LocalRow {
  path: string
  filename: string
  previewFamily: string | null
  weight: number
  style: 'normal' | 'italic'
}

let installedCache: InstalledFamily[] | null = null

/** Map an installed family's faces to weight/style file entries. */
function facesToLocal(fam: InstalledFamily): LocalFontFile[] {
  const seen = new Set<string>()
  const out: LocalFontFile[] = []
  for (const face of fam.faces) {
    const { weight, style } = detectWeightStyle(`${face.style} ${face.path}`)
    const key = `${weight}-${style}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push({ path: face.path, weight, style })
  }
  return out
}

function GoogleResult({
  meta,
  added,
  onAdd,
}: {
  meta: GoogleFontMeta
  added: boolean
  onAdd: () => void
}): React.ReactElement {
  useEffect(() => {
    loadGoogleFont(meta.family, ['400'])
  }, [meta.family])
  return (
    <div className={styles.result}>
      <div className={styles.resultMain}>
        <span
          className={styles.resultName}
          style={{ fontFamily: `'${meta.family}', ${categoryGeneric(meta.category)}` }}
        >
          {meta.family}
        </span>
        <span className={styles.resultMeta}>
          {meta.category} · {meta.weights.length} weight{meta.weights.length === 1 ? '' : 's'}
        </span>
      </div>
      {added ? (
        <span className={styles.added}>
          <FontAwesomeIcon icon={faCheck} /> Added
        </span>
      ) : (
        <Button size="md" variant="secondary" onClick={onAdd}>
          Add
        </Button>
      )}
    </div>
  )
}

export function FontAdder({
  open,
  onClose,
  existing,
  onAddGoogle,
  onAddLocal,
}: FontAdderProps): React.ReactElement | null {
  const [busy, setBusy] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  /** Every add goes through here: await it, close only on success, show why on failure. */
  async function run(write: () => unknown, closeAfter = true): Promise<void> {
    if (busy) return
    setBusy(true)
    setSaveError(null)
    try {
      await write()
      if (closeAfter) onClose()
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  const [tab, setTab] = useState<'google' | 'installed' | 'local'>('google')
  const [list, setList] = useState<GoogleFontMeta[] | null>(googleCache)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<CategoryId>('all')
  const [loadErr, setLoadErr] = useState(false)

  // Installed (Font Book) state
  const [installed, setInstalled] = useState<InstalledFamily[] | null>(installedCache)
  const [installedQuery, setInstalledQuery] = useState('')
  const [installedErr, setInstalledErr] = useState(false)

  // Local-file state (Webflow-style: many files → one family)
  const [localRows, setLocalRows] = useState<LocalRow[]>([])
  const [localFamily, setLocalFamily] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open || list) return
    window.api.font
      .googleList()
      .then(g => {
        googleCache = g
        setList(g)
      })
      .catch(() => setLoadErr(true))
  }, [open, list])

  useEffect(() => {
    if (!open || tab !== 'installed' || installed) return
    window.api.font
      .listInstalled()
      .then(f => {
        installedCache = f
        setInstalled(f)
      })
      .catch(() => setInstalledErr(true))
  }, [open, tab, installed])

  useEffect(() => {
    if (!open) {
      setBusy(false)
      setSaveError(null)
      setTab('google')
      setQuery('')
      setCategory('all')
      setInstalledQuery('')
      setLocalRows([])
      setLocalFamily('')
      setDragOver(false)
    }
  }, [open])

  const installedResults = useMemo(() => {
    if (!installed) return []
    const q = installedQuery.trim().toLowerCase()
    const pool = q ? installed.filter(f => f.family.toLowerCase().includes(q)) : installed
    return pool.slice(0, 80)
  }, [installed, installedQuery])

  const localDup = useMemo(() => {
    const f = localFamily.trim().toLowerCase()
    return f.length > 0 && [...existing].some(e => e.toLowerCase() === f)
  }, [localFamily, existing])

  const results = useMemo(() => {
    if (!list) return []
    const q = query.trim().toLowerCase()
    const pool = list.filter(
      f => (category === 'all' || f.category.toLowerCase() === category) && (!q || f.family.toLowerCase().includes(q)),
    )
    return [...pool].sort((a, b) => a.popularity - b.popularity).slice(0, 50)
  }, [list, query, category])

  async function handleFiles(files: FileList | File[]): Promise<void> {
    const valid = Array.from(files).filter(f => /\.(ttf|otf|woff2?|woff)$/i.test(f.name))
    if (valid.length === 0) return
    const rows: LocalRow[] = []
    for (const file of valid) {
      const path = window.api.getPathForFile(file)
      const bytes = new Uint8Array(await file.arrayBuffer())
      const previewFamily = await loadPreviewFont(bytes)
      const { weight, style } = detectWeightStyle(file.name)
      rows.push({ path, filename: file.name, previewFamily, weight, style })
    }
    setLocalRows(prev => [...prev, ...rows])
    setLocalFamily(prev => prev || familyFromFilename(valid[0].name))
  }

  function setRow(i: number, patch: Partial<LocalRow>): void {
    setLocalRows(prev => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)))
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add a font"
      size="xl"
      header={
        <SegmentedControl
          ariaLabel="Font source"
          value={tab}
          onChange={setTab}
          options={[
            { id: 'google', label: 'Google Fonts', icon: faMagnifyingGlass },
            { id: 'installed', label: 'Installed', icon: faLaptop },
            { id: 'local', label: 'Upload file', icon: faUpload },
          ]}
        />
      }
    >
      {tab === 'google' ? (
        <div className={styles.googleBody}>
          <Input autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder="Search Google Fonts…" />
          <SegmentedControl
            ariaLabel="Category"
            size="sm"
            value={category}
            onChange={setCategory}
            options={CATEGORIES}
          />
          <div className={styles.results}>
            {loadErr ? (
              <p className={styles.empty}>Couldn't reach Google Fonts. Check your connection.</p>
            ) : !list ? (
              <div className={styles.loading}>
                <Spinner /> Loading catalogue…
              </div>
            ) : results.length === 0 ? (
              <p className={styles.empty}>No families match your filters.</p>
            ) : (
              results.map(meta => (
                <GoogleResult
                  key={meta.family}
                  meta={meta}
                  added={existing.has(meta.family)}
                  onAdd={() => run(() => onAddGoogle(meta), false)}
                />
              ))
            )}
          </div>
        </div>
      ) : tab === 'installed' ? (
        <div className={styles.googleBody}>
          <Input
            autoFocus
            value={installedQuery}
            onChange={e => setInstalledQuery(e.target.value)}
            placeholder="Search installed fonts…"
          />
          <div className={styles.results}>
            {installedErr ? (
              <p className={styles.empty}>Couldn’t read your installed fonts.</p>
            ) : !installed ? (
              <div className={styles.loading}>
                <Spinner /> Reading Font Book…
              </div>
            ) : installedResults.length === 0 ? (
              <p className={styles.empty}>No installed families match.</p>
            ) : (
              installedResults.map(fam => (
                <div key={fam.family} className={styles.result}>
                  <div className={styles.resultMain}>
                    <span className={styles.resultName} style={{ fontFamily: `'${fam.family}'` }}>
                      {fam.family}
                    </span>
                    <span className={styles.resultMeta}>
                      {fam.faces.length} style{fam.faces.length === 1 ? '' : 's'}
                    </span>
                  </div>
                  {existing.has(fam.family) ? (
                    <span className={styles.added}>
                      <FontAwesomeIcon icon={faCheck} /> Added
                    </span>
                  ) : (
                    <Button
                      size="md"
                      variant="secondary"
                      onClick={() => run(() => onAddLocal(fam.family, facesToLocal(fam)), false)}
                    >
                      Add
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className={styles.localBody}>
          {localRows.length === 0 ? (
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
                handleFiles(e.dataTransfer.files)
              }}
            >
              <FontAwesomeIcon icon={faUpload} className={styles.dropIcon} />
              <p className={styles.dropText}>Drop font files, or click to choose</p>
              <p className={styles.dropHint}>
                One family at a time. Add every weight & italic. .ttf · .otf · .woff · .woff2
              </p>
              <input
                ref={fileRef}
                type="file"
                multiple
                accept=".ttf,.otf,.woff,.woff2"
                className={styles.fileInput}
                onChange={e => {
                  if (e.target.files) handleFiles(e.target.files)
                  e.target.value = ''
                }}
              />
            </div>
          ) : (
            <>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>Family name</span>
                <Input value={localFamily} onChange={e => setLocalFamily(e.target.value)} placeholder="e.g. Inter" />
                {localDup && (
                  <span className={styles.dupWarn}>
                    “{localFamily.trim()}” is already in your library, so this adds a duplicate.
                  </span>
                )}
              </label>
              <div className={styles.fileRows}>
                {localRows.map((row, i) => (
                  <div key={row.path + i} className={styles.fileRow}>
                    <span
                      className={styles.fileSpecimen}
                      style={row.previewFamily ? { fontFamily: `'${row.previewFamily}'` } : undefined}
                    >
                      Ag
                    </span>
                    <span className={styles.fileName} title={row.filename}>
                      {row.filename}
                    </span>
                    <span className={styles.weightCell}>
                      <Select
                        block
                        ariaLabel="Weight"
                        align="right"
                        value={String(row.weight)}
                        onChange={k => setRow(i, { weight: Number(k) })}
                        options={WEIGHTS.map(w => ({ key: String(w.value), label: w.label }))}
                      />
                    </span>
                    <span className={styles.styleCell}>
                      <Select
                        block
                        ariaLabel="Style"
                        align="right"
                        value={row.style}
                        onChange={k => setRow(i, { style: k as 'normal' | 'italic' })}
                        options={[
                          { key: 'normal', label: 'Normal' },
                          { key: 'italic', label: 'Italic' },
                        ]}
                      />
                    </span>
                    <button
                      type="button"
                      className={['icon-btn', 'icon-btn--xs'].join(' ')}
                      onClick={() => setLocalRows(prev => prev.filter((_, idx) => idx !== i))}
                      aria-label="Remove file"
                    >
                      <FontAwesomeIcon icon={faXmark} />
                    </button>
                  </div>
                ))}
              </div>
              <span className={styles.addMoreWrap}>
                <Button variant="secondary" size="md" onClick={() => fileRef.current?.click()}>
                  <FontAwesomeIcon icon={faUpload} /> Add more files
                </Button>
              </span>
              <input
                ref={fileRef}
                type="file"
                multiple
                accept=".ttf,.otf,.woff,.woff2"
                className={styles.fileInput}
                onChange={e => {
                  if (e.target.files) handleFiles(e.target.files)
                  e.target.value = ''
                }}
              />
            </>
          )}
        </div>
      )}

      {tab === 'local' && localRows.length > 0 && (
        <div className={styles.footer}>
          {saveError && (
            <span className={styles.saveError} title={saveError}>
              {saveError}
            </span>
          )}
          <Button
            variant="ghost"
            size="md"
            onClick={() => {
              setLocalRows([])
              setLocalFamily('')
            }}
          >
            Clear
          </Button>
          <Button
            variant="primary"
            size="md"
            disabled={!localFamily.trim()}
            onClick={() =>
              run(() =>
                onAddLocal(
                  localFamily.trim(),
                  localRows.map(r => ({ path: r.path, weight: r.weight, style: r.style })),
                ),
              )
            }
          >
            Add font · {localRows.length} file{localRows.length === 1 ? '' : 's'}
          </Button>
        </div>
      )}
    </Modal>
  )
}
