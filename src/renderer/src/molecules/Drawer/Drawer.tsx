import React, { useRef } from 'react'
import { useFocusTrap } from '../../hooks/useFocusTrap'
import styles from './Drawer.module.css'

interface DrawerProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
}

export function Drawer({ open, onClose, children }: DrawerProps): React.ReactElement {
  const panelRef = useRef<HTMLElement>(null)
  useFocusTrap(open, panelRef, onClose)

  return (
    <>
      <div
        className={[styles.backdrop, open ? styles.open : ''].filter(Boolean).join(' ')}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        ref={panelRef}
        className={[styles.drawer, open ? styles.open : ''].filter(Boolean).join(' ')}
        aria-hidden={!open}
        role="dialog"
        aria-modal={open}
        tabIndex={-1}
      >
        {children}
      </aside>
    </>
  )
}
