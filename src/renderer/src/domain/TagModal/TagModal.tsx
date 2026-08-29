import React, { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheck } from '@fortawesome/free-solid-svg-icons'
import { Button } from '../../atoms/Button/Button'
import { Input } from '../../atoms/Input/Input'
import { TAG_COLOURS } from '../../lib/tagColours'
import { prefersDarkText } from '../../lib/colour'
import Modal from '../../primitives/Modal/Modal'
import styles from './TagModal.module.css'

interface TagModalProps {
  open: boolean
  mode: 'create' | 'edit'
  initial?: { label?: string; colour?: string }
  onSubmit: (label: string, colour: string) => Promise<void>
  onClose: () => void
}

export function TagModal({ open, mode, initial, onSubmit, onClose }: TagModalProps): React.ReactElement | null {
  const [label, setLabel] = useState('')
  const [colour, setColour] = useState(TAG_COLOURS[0])
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (open) {
      setLabel(initial?.label ?? '')
      setColour(initial?.colour ?? TAG_COLOURS[0])
      setError(null)
      setBusy(false)
    }
  }, [open, initial])

  async function submit(): Promise<void> {
    if (!label.trim() || busy) return
    setBusy(true)
    setError(null)
    try {
      await onSubmit(label.trim(), colour)
    } catch {
      setError('A project with that name already exists.')
      setBusy(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === 'create' ? 'New project' : 'Edit project'}
      size="md"
      footer={
        <>
          <Button variant="ghost" size="md" onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="md" onClick={submit} disabled={!label.trim() || busy}>
            {mode === 'create' ? 'Add project' : 'Save'}
          </Button>
        </>
      }
    >
      <div className={styles.body}>
          <Input
            autoFocus
            value={label}
            error={!!error}
            onChange={e => { setLabel(e.target.value); setError(null) }}
            placeholder="Project name"
            onKeyDown={e => { if (e.key === 'Enter') submit() }}
          />
          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.swatches}>
            {TAG_COLOURS.map(c => {
              const on = c === colour
              return (
                <button
                  key={c}
                  type="button"
                  className={[styles.swatch, on ? styles.swatchOn : ''].filter(Boolean).join(' ')}
                  style={{ background: c }}
                  aria-label={`Colour ${c}`}
                  onClick={() => setColour(c)}
                >
                  {on && <FontAwesomeIcon icon={faCheck} className={styles.check} style={{ color: prefersDarkText(c) ? '#000' : '#fff' }} />}
                </button>
              )
            })}
          </div>
      </div>
    </Modal>
  )
}
