import React, { useState, useEffect, useMemo, useRef } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark, faMagnifyingGlass, faUpload, faCheck } from '@fortawesome/free-solid-svg-icons'
import type { GoogleFontMeta } from '@shared/types'
import { Button } from '../../atoms/Button/Button'
import { IconButton } from '../../atoms/IconButton/IconButton'
import { Input } from '../../atoms/Input/Input'
import { Spinner } from '../../atoms/Spinner/Spinner'
import {
  loadGoogleFont, loadPreviewFont, familyFromFilename, categoryGeneric,
} from '../../lib/fontLoader'
import styles from './FontAdder.module.css'

interface FontAdderProps {
  open: boolean
  onClose: () => void
  existing: Set<string>
  onAddGoogle: (meta: GoogleFontMeta) => void
  onAddLocal: (family: string, category: string, path: string) => void
}

// Session-level cache of the Google catalogue (fetched once).
let googleCache: GoogleFontMeta[] | null = null

function GoogleResult({ meta, added, onAdd }: { meta: GoogleFontMeta; added: boolean; onAdd: () => void }): React.ReactElement {
  useEffect(() => { loadGoogleFont(meta.family, ['400']) }, [meta.family])
  return (
    <div className={styles.result}>
      <div className={styles.resultMain}>
        <span className={styles.resultName} style={{ fontFamily: `'${meta.family}', ${categoryGeneric(meta.category)}` }}>
          {meta.family}
        </span>
        <span className={styles.resultMeta}>{meta.category} · {meta.weights.length} weight{meta.weights.length === 1 ? '' : 's'}</span>
      </div>
      {added ? (
        <span className={styles.added}><FontAwesomeIcon icon={faCheck} /> Added</span>
      ) : (
        <Button size="md" variant="secondary" onClick={onAdd}>Add</Button>
      )}
    </div>
  )
}

export function FontAdder({ open, onClose, existing, onAddGoogle, onAddLocal }: FontAdderProps): React.ReactElement | null {
  const [tab, setTab] = useState<'google' | 'local'>('google')
  const [list, setList] = useState<GoogleFontMeta[] | null>(googleCache)
  const [query, setQuery] = useState('')
  const [loadErr, setLoadErr] = useState(false)

  // Local-file state
  const [localPath, setLocalPath] = useState<string | null>(null)
  const [localFamily, setLocalFamily] = useState('')
  const [previewFamily, setPreviewFamily] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent): void => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => {
    if (!open || list) return
    window.api.font.googleList()
      .then(g => { googleCache = g; setList(g) })
      .catch(() => setLoadErr(true))
  }, [open, list])

  useEffect(() => {
    if (!open) {
      setTab('google'); setQuery(''); setLocalPath(null); setLocalFamily(''); setPreviewFamily(null); setDragOver(false)
    }
  }, [open])

  const results = useMemo(() => {
    if (!list) return []
    const q = query.trim().toLowerCase()
    const pool = q ? list.filter(f => f.family.toLowerCase().includes(q)) : list
    return [...pool].sort((a, b) => a.popularity - b.popularity).slice(0, 50)
  }, [list, query])

  async function handleFile(file: File): Promise<void> {
    if (!/\.(ttf|otf|woff2?|woff)$/i.test(file.name)) return
    const path = window.api.getPathForFile(file)
    const bytes = new Uint8Array(await file.arrayBuffer())
    const pf = await loadPreviewFont(bytes)
    setLocalPath(path)
    setLocalFamily(familyFromFilename(file.name))
    setPreviewFamily(pf)
  }

  if (!open) return null

  return (
    <div className={styles.overlay} role="dialog" aria-modal aria-label="Add a font">
      <div className={styles.modal}>
        <div className={styles.header}>
          <div className={styles.tabs}>
            <button type="button" className={[styles.tab, tab === 'google' ? styles.tabOn : ''].filter(Boolean).join(' ')} onClick={() => setTab('google')}>
              <FontAwesomeIcon icon={faMagnifyingGlass} /> Google Fonts
            </button>
            <button type="button" className={[styles.tab, tab === 'local' ? styles.tabOn : ''].filter(Boolean).join(' ')} onClick={() => setTab('local')}>
              <FontAwesomeIcon icon={faUpload} /> Local file
            </button>
          </div>
          <IconButton label="Close" onClick={onClose}><FontAwesomeIcon icon={faXmark} /></IconButton>
        </div>

        {tab === 'google' ? (
          <div className={styles.googleBody}>
            <Input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search Google Fonts…"
            />
            <div className={styles.results}>
              {loadErr ? (
                <p className={styles.empty}>Couldn’t reach Google Fonts. Check your connection.</p>
              ) : !list ? (
                <div className={styles.loading}><Spinner /> Loading catalogue…</div>
              ) : results.length === 0 ? (
                <p className={styles.empty}>No families match “{query}”.</p>
              ) : (
                results.map(meta => (
                  <GoogleResult
                    key={meta.family}
                    meta={meta}
                    added={existing.has(meta.family)}
                    onAdd={() => onAddGoogle(meta)}
                  />
                ))
              )}
            </div>
          </div>
        ) : (
          <div className={styles.localBody}>
            {!localPath ? (
              <div
                className={[styles.dropzone, dragOver ? styles.dropzoneActive : ''].filter(Boolean).join(' ')}
                onClick={() => fileRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
              >
                <FontAwesomeIcon icon={faUpload} className={styles.dropIcon} />
                <p className={styles.dropText}>Drop a font file, or click to choose</p>
                <p className={styles.dropHint}>.ttf · .otf · .woff · .woff2</p>
                <input ref={fileRef} type="file" accept=".ttf,.otf,.woff,.woff2" className={styles.fileInput}
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
              </div>
            ) : (
              <div className={styles.localResult}>
                <div className={styles.localPreview} style={previewFamily ? { fontFamily: `'${previewFamily}'` } : undefined}>
                  The quick brown fox jumps over the lazy dog
                </div>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>Family name</span>
                  <Input value={localFamily} onChange={e => setLocalFamily(e.target.value)} />
                </label>
                <p className={styles.pathHint}>{localPath}</p>
              </div>
            )}
          </div>
        )}

        {tab === 'local' && localPath && (
          <div className={styles.footer}>
            <Button variant="ghost" size="md" onClick={() => { setLocalPath(null); setPreviewFamily(null); setLocalFamily('') }}>
              Choose another
            </Button>
            <Button
              variant="primary"
              size="md"
              disabled={!localFamily.trim()}
              onClick={() => { onAddLocal(localFamily.trim(), 'Local', localPath); onClose() }}
            >
              Add font
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
