import React, { useId, useRef } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark } from '@fortawesome/free-solid-svg-icons'
import { useFocusTrap } from '../../hooks/useFocusTrap'
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
  /** Replaces the header's title node — a tab strip, typically. `title` still names
   *  the dialog for assistive tech. The close button and the rule stay. */
  header?: React.ReactNode
  /** Closing on a backdrop click is opt-in: a destructive confirm should not. */
  dismissOnBackdrop?: boolean
  footer?: React.ReactNode
  children: React.ReactNode
}

/**
 * The shared modal shell: overlay, panel, focus management.
 *
 * Focus is handled by useFocusTrap, which Drawer uses too — every hand-rolled copy of
 * this shell handled Escape and none of them trapped focus or gave it back.
 */
export default function Modal({
  open,
  onClose,
  title,
  size = 'md',
  chrome = 'header',
  align = 'center',
  header,
  dismissOnBackdrop = false,
  footer,
  children,
}: ModalProps): React.JSX.Element | null {
  const panelRef = useRef<HTMLDivElement>(null)
  const titleId = useId()

  useFocusTrap(open, panelRef, onClose)

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
        {...(header ? { 'aria-label': title } : { 'aria-labelledby': titleId })}
        tabIndex={-1}
      >
        {chrome === 'header' ? (
          <>
            <div className={styles.header}>
              {header ?? <h2 id={titleId} className={styles.title}>{title}</h2>}
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
