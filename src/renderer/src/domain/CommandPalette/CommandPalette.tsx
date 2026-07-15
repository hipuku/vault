import React, { useEffect, useMemo, useRef, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons'
import { filterCommands, type Searchable } from '../../lib/commandFilter'
import styles from './CommandPalette.module.css'

export interface Command extends Searchable {
  icon?: IconDefinition
  /** Tints the icon (e.g. a colour swatch); overrides the default muted colour. */
  iconColor?: string
  /** Shown right-aligned as context, e.g. the group ("Navigate", "Create"). */
  hint?: string
  /** Hidden from the default (empty-query) view; only surfaced while searching. */
  searchOnly?: boolean
  run: () => void
}

interface CommandPaletteProps {
  open: boolean
  commands: Command[]
  onClose: () => void
}

/**
 * ⌘K command palette. Keyboard-first: ↑/↓ move, ⏎ runs, Esc closes. Focus is
 * pulled into the input on open and returned to the trigger on close. Follows
 * the WAI-ARIA combobox + listbox pattern (aria-activedescendant on the input).
 */
export function CommandPalette({ open, commands, onClose }: CommandPaletteProps): React.ReactElement | null {
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const results = useMemo(() => {
    // Default view is just the actions; library items only appear once searching.
    if (query.trim() === '') return commands.filter(c => !c.searchOnly)
    return filterCommands(commands, query)
  }, [commands, query])

  // Reset query + selection and focus the input each time it opens.
  useEffect(() => {
    if (open) {
      setQuery('')
      setActive(0)
      inputRef.current?.focus()
    }
  }, [open])

  // Selection returns to the top whenever the result set changes.
  useEffect(() => {
    setActive(0)
  }, [query])

  // Keep the highlighted row in view during keyboard navigation.
  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>('[data-active="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [active, results])

  // Lock background scroll while open; restore focus to the trigger on close.
  useEffect(() => {
    if (!open) return
    const previouslyFocused = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
      previouslyFocused?.focus?.()
    }
  }, [open])

  if (!open) return null

  function choose(cmd: Command | undefined): void {
    if (!cmd) return
    cmd.run()
    onClose()
  }

  function handleKeyDown(e: React.KeyboardEvent): void {
    switch (e.key) {
      case 'Escape':
        e.preventDefault()
        onClose()
        break
      case 'ArrowDown':
        e.preventDefault()
        setActive(i => Math.min(i + 1, results.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setActive(i => Math.max(i - 1, 0))
        break
      case 'Enter':
        e.preventDefault()
        choose(results[active])
        break
    }
  }

  const activeId = results[active] ? `command-${results[active].id}` : undefined

  return (
    <div className={styles.overlay} onMouseDown={onClose}>
      <div
        className={styles.palette}
        role="dialog"
        aria-modal
        aria-label="Command palette"
        onMouseDown={e => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className={styles.inputRow}>
          <FontAwesomeIcon icon={faMagnifyingGlass} className={styles.inputIcon} />
          <input
            ref={inputRef}
            className={styles.input}
            type="text"
            role="combobox"
            aria-expanded
            aria-controls="command-list"
            aria-activedescendant={activeId}
            placeholder="Jump to a section, project, or create…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoComplete="off"
            spellCheck={false}
          />
        </div>

        {results.length === 0 ? (
          <div className={styles.empty}>No matches</div>
        ) : (
          <ul id="command-list" ref={listRef} role="listbox" aria-label="Commands" className={styles.list}>
            {results.map((cmd, i) => (
              <li
                key={cmd.id}
                id={`command-${cmd.id}`}
                role="option"
                aria-selected={i === active}
                data-active={i === active}
                className={[styles.item, i === active ? styles.itemActive : ''].filter(Boolean).join(' ')}
                onMouseMove={() => setActive(i)}
                onClick={() => choose(cmd)}
              >
                {cmd.icon && (
                  <FontAwesomeIcon
                    icon={cmd.icon}
                    className={styles.itemIcon}
                    style={cmd.iconColor ? { color: cmd.iconColor } : undefined}
                  />
                )}
                <span className={styles.itemLabel}>{cmd.label}</span>
                {cmd.hint && <span className={styles.itemHint}>{cmd.hint}</span>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
