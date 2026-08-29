import React, { useEffect } from 'react'
import styles from './Drawer.module.css'

interface DrawerProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
}

export function Drawer({ open, onClose, children }: DrawerProps): React.ReactElement {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  return (
    <>
      <div
        className={[styles.backdrop, open ? styles.open : ''].filter(Boolean).join(' ')}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={[styles.drawer, open ? styles.open : ''].filter(Boolean).join(' ')}
        aria-hidden={!open}
      >
        {children}
      </aside>
    </>
  )
}
