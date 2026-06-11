import React, { useState, useRef, useEffect } from 'react'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import styles from './Menu.module.css'

export interface MenuItem {
  label: string
  icon?: IconDefinition
  onClick: () => void
  danger?: boolean
}

interface MenuProps {
  trigger: React.ReactNode
  items: MenuItem[]
  align?: 'left' | 'right'
  triggerLabel: string
}

/** A small dropdown: a trigger button + a floating panel of actions. Closes on
 *  outside-click and Escape. */
export function Menu({ trigger, items, align = 'right', triggerLabel }: MenuProps): React.ReactElement {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent): void {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent): void { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('mousedown', onDown)
    window.addEventListener('keydown', onKey)
    return () => { window.removeEventListener('mousedown', onDown); window.removeEventListener('keydown', onKey) }
  }, [open])

  return (
    <div className={styles.root} ref={ref}>
      <button
        type="button"
        className={styles.trigger}
        aria-label={triggerLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
      >
        {trigger}
      </button>
      {open && (
        <div className={[styles.panel, align === 'left' ? styles.left : styles.right].join(' ')} role="menu">
          {items.map((item, i) => (
            <button
              key={i}
              type="button"
              role="menuitem"
              className={[styles.item, item.danger ? styles.danger : ''].filter(Boolean).join(' ')}
              onClick={() => { setOpen(false); item.onClick() }}
            >
              {item.icon && <FontAwesomeIcon icon={item.icon} className={styles.itemIcon} />}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
