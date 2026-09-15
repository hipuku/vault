import React, { useState, useEffect, useId } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheck } from '@fortawesome/free-solid-svg-icons'
import { Button } from '../../atoms/Button/Button'
import { Input } from '../../atoms/Input/Input'
import { TAG_COLOURS } from '../../lib/tagColours'
import { prefersDarkText } from '../../lib/colour'
import { hueFamily } from '../../lib/colourSort'
import Modal from '../../molecules/Modal/Modal'
import styles from './TagModal.module.css'

/** A name for each colour a screen reader can say. Each was named by its hex, which
 *  is read out character by character and says nothing about the colour. The hue
 *  family says it, numbered where the twelve share one: Blue 1, Blue 2, Blue 3. */
const COLOUR_NAMES: Record<string, string> = (() => {
  const families = TAG_COLOURS.map(c => hueFamily(c))
  const seen: Record<string, number> = {}
  return Object.fromEntries(
    TAG_COLOURS.map((c, i) => {
      const family = families[i]
      const shared = families.filter(f => f === family).length > 1
      seen[family] = (seen[family] ?? 0) + 1
      return [c, shared ? `${family} ${seen[family]}` : family]
    }),
  )
})()

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
  const errorId = useId()
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
          <Button variant="ghost" size="md" onClick={onClose}>
            Cancel
          </Button>
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
          aria-label="Project name"
          aria-describedby={error ? errorId : undefined}
          onChange={e => {
            setLabel(e.target.value)
            setError(null)
          }}
          placeholder="Project name"
          onKeyDown={e => {
            if (e.key === 'Enter') submit()
          }}
        />
        {error && (
          <p id={errorId} className={styles.error} role="alert">
            {error}
          </p>
        )}

        <div className={styles.swatches} role="group" aria-label="Project colour">
          {TAG_COLOURS.map(c => {
            const on = c === colour
            return (
              <button
                key={c}
                type="button"
                className={[styles.swatch, on ? styles.swatchOn : ''].filter(Boolean).join(' ')}
                style={{ background: c }}
                aria-label={COLOUR_NAMES[c]}
                aria-pressed={on}
                onClick={() => setColour(c)}
              >
                {on && (
                  <FontAwesomeIcon
                    icon={faCheck}
                    className={styles.check}
                    style={{ color: prefersDarkText(c) ? '#000' : '#fff' }}
                  />
                )}
              </button>
            )
          })}
        </div>
      </div>
    </Modal>
  )
}
