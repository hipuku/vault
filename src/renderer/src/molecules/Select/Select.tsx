import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronDown } from '@fortawesome/free-solid-svg-icons'
import { usePopover } from '../../hooks/usePopover'
import { Popover } from '../../atoms/Popover/Popover'
import { TriggerPill } from '../../atoms/TriggerPill/TriggerPill'
import { MenuOption } from '../../atoms/MenuOption/MenuOption'
import styles from './Select.module.css'

export interface SelectOption<K extends string> {
  key: K
  label: string
}

interface SelectProps<K extends string> {
  value: K
  options: ReadonlyArray<SelectOption<K>>
  onChange: (key: K) => void
  /** Accessible label for the trigger (e.g. "Sort"). */
  ariaLabel: string
  /** Optional label prefix shown before the value in the trigger (e.g. "Sort:"). */
  prefix?: string
  align?: 'left' | 'right'
  /** Full-width, input-styled trigger (for form fields) instead of the toolbar pill. */
  block?: boolean
}

/** A custom dropdown replacing native <select>: a trigger (current label +
 *  padded chevron) opening a panel of options with a check on the selected one.
 *  Closes on outside-click and Escape — mirrors the Menu primitive. */
export function Select<K extends string>({
  value,
  options,
  onChange,
  ariaLabel,
  prefix,
  align = 'left',
  block = false,
}: SelectProps<K>): React.ReactElement {
  const { open, setOpen, toggle, ref } = usePopover()

  const current = options.find(o => o.key === value)

  return (
    <div className={[styles.root, block ? styles.block : ''].filter(Boolean).join(' ')} ref={ref}>
      <TriggerPill
        block={block}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => toggle()}
      >
        <span className={styles.label}>
          {prefix && <span className={styles.prefix}>{prefix} </span>}
          {current?.label}
        </span>
        <FontAwesomeIcon icon={faChevronDown} className={styles.caret} />
      </TriggerPill>
      {open && (
        <Popover align={align === 'right' ? 'right' : 'stretch'} pad="tight" role="listbox">
          {options.map(o => (
            <MenuOption
              key={o.key}
              role="option"
              aria-selected={o.key === value}
              label={o.label}
              selected={o.key === value}
              onClick={() => { setOpen(false); onChange(o.key) }}
            />
          ))}
        </Popover>
      )}
    </div>
  )
}
