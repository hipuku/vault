import React, { useRef } from 'react'
import { useFocusTrap } from '../../hooks/useFocusTrap'
import styles from './Drawer.module.css'

interface DrawerProps {
  open: boolean
  onClose: () => void
  /**
   * What the panel is, for anyone who cannot see it. Required rather than
   * optional: a dialog with no accessible name announces as "dialog" and
   * nothing else, which is axe's aria-dialog-name and was true of both call
   * sites until this was added.
   */
  ariaLabel: string
  children: React.ReactNode
}

export function Drawer({ open, onClose, ariaLabel, children }: DrawerProps): React.ReactElement {
  const panelRef = useRef<HTMLDivElement>(null)
  useFocusTrap(open, panelRef, onClose)

  return (
    <>
      <div
        className={[styles.backdrop, open ? styles.open : ''].filter(Boolean).join(' ')}
        onClick={onClose}
        aria-hidden="true"
      />
      {/* A div, not an aside: `aside` carries an implicit `complementary` role,
          and `dialog` is not an allowed override for it, so the element and the
          role disagreed. axe's aria-allowed-role, found once this component was
          tested. Nothing visual changes; the class carries the styling. */}
      <div
        ref={panelRef}
        className={[styles.drawer, open ? styles.open : ''].filter(Boolean).join(' ')}
        aria-hidden={!open}
        role="dialog"
        aria-label={ariaLabel}
        aria-modal={open}
        tabIndex={-1}
      >
        {children}
      </div>
    </>
  )
}
