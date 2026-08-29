import React, { useState, useMemo } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCopy, faCheck, faDownload } from '@fortawesome/free-solid-svg-icons'
import { Button } from '../../atoms/Button/Button'
import { SegmentedControl } from '../../atoms/SegmentedControl/SegmentedControl'
import { useCopy } from '../../hooks/useCopy'
import Modal from '../../molecules/Modal/Modal'
import styles from './ExportModal.module.css'

export interface ExportFormatDef {
  id: string
  label: string
  ext: string
  /** Optional one-line note shown in the footer for this format. */
  hint?: string
}

interface ExportModalProps {
  open: boolean
  onClose: () => void
  /** Shown in the title — usually the artifact name. */
  title: string
  formats: ExportFormatDef[]
  /** Produce the export string for a given format id. */
  generate: (formatId: string) => string
  /** Base for the download filename (slugified). */
  filenameBase: string
}

function fileSlug(s: string): string {
  return s.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'export'
}

export function ExportModal({ open, onClose, title, formats, generate, filenameBase }: ExportModalProps): React.ReactElement | null {
  const [formatId, setFormatId] = useState(formats[0]?.id ?? '')
  const { copy, copied } = useCopy()

  const code = useMemo(() => (formatId ? generate(formatId) : ''), [formatId, generate])

  const meta = formats.find(f => f.id === formatId) ?? formats[0]

  function download(): void {
    const blob = new Blob([code], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${fileSlug(filenameBase)}.${meta.ext}`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Export “${title}”`}
      size="xl"
      footer={
        <>
          <span className={styles.hint}>{meta?.hint ?? ''}</span>
          <Button variant="secondary" size="md" onClick={download}>
            <FontAwesomeIcon icon={faDownload} /> Download .{meta?.ext}
          </Button>
          <Button variant="primary" size="md" onClick={() => copy(code)}>
            <FontAwesomeIcon icon={copied ? faCheck : faCopy} /> {copied ? 'Copied' : 'Copy'}
          </Button>
        </>
      }
    >
      <div className={styles.formats}>
          <SegmentedControl
            ariaLabel="Export format"
            options={formats.map(f => ({ id: f.id, label: f.label }))}
            value={formatId}
            onChange={setFormatId}
          />
        </div>

      <pre className={styles.code}><code>{code}</code></pre>
    </Modal>
  )
}
