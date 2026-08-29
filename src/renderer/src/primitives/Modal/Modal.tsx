import React, { useEffect, useId, useRef } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark } from '@fortawesome/free-solid-svg-icons'
import { IconButton } from '../../atoms/IconButton/IconButton'
import styles from './Modal.module.css'

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl'

export interface ModalProps {
  open: boolean
  onClose: () => void
  /** Accessible name, and the header title unless `chrome` is 'plain'. */
  title: string
  size?: ModalSize
  /** 'header' draws the titled bar with a close button; 'plain' is a padded box. */
  chrome?: 'header' | 'plain'
  /** Search-led surfaces sit high rather than centred. */
  align?: 'center' | 'top'
  /** Closing on a backdrop click is opt-in: a destructive confirm should not. */
  dismissOnBackdrop?: boolean
  footer?: React.ReactNode
  children: React.ReactNode
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), ' +
  'textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * The shared modal shell: overlay, panel, focus management.
 *
 * The focus behaviour is the reason this exists as much as the styling is. Every
 * hand-rolled copy handled Escape and none of them trapped focus or gave it back, so
 * Tab walked into the page behind the dialog and closing one dropped focus to <body>.
 * Doing it here fixes it everywhere at once.
 */
export default function Modal({
  open,
  onClose,
  title,
  size = 'md',
  chrome = 'header',
  align = 'center',
  dismissOnBackdrop = false,
  footer,
  children,
}: ModalProps): React.JSX.Element | null {
  const panelRef = useRef<HTMLDivElement>(null)
  const titleId = useId()

  useEffect(() => {
    if (!open) return
    const opener = document.activeElement as HTMLElement | null

    // Move focus in: the first field if there is one, otherwise the panel itself, so
    // the next Tab starts inside the dialog rather than at the top of the page.
    const panel = panelRef.current
    const first = panel?.querySelector<HTMLElement>(FOCUSABLE)
    ;(first ?? panel)?.focus()

    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key !== 'Tab' || !panel) return
      const items = [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)]
      if (items.length === 0) {
        e.preventDefault()
        return
      }
      const edge = e.shiftKey ? items[0] : items[items.length - 1]
      if (document.activeElement === edge) {
        e.preventDefault()
        ;(e.shiftKey ? items[items.length - 1] : items[0]).focus()
      }
    }

    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      opener?.focus()
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className={[styles.overlay, styles[align]].join(' ')}
      onMouseDown={dismissOnBackdrop ? e => { if (e.target === e.currentTarget) onClose() } : undefined}
    >
      <div
        ref={panelRef}
        className={[styles.panel, styles[size], chrome === 'plain' ? styles.plain : styles.chromed]
          .join(' ')}
        role="dialog"
        aria-modal
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        {chrome === 'header' ? (
          <>
            <div className={styles.header}>
              <h2 id={titleId} className={styles.title}>{title}</h2>
              <IconButton label="Close" onClick={onClose}>
                <FontAwesomeIcon icon={faXmark} />
              </IconButton>
            </div>
            <div className={styles.body}>{children}</div>
            {footer ? <div className={styles.footer}>{footer}</div> : null}
          </>
        ) : (
          <>
            <h2 id={titleId} className={styles.title}>{title}</h2>
            {children}
            {footer ? <div className={styles.footer}>{footer}</div> : null}
          </>
        )}
      </div>
    </div>
  )
}
