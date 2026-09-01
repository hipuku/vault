import React, { useId, useMemo } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronDown } from '@fortawesome/free-solid-svg-icons'
import { usePopover } from '../../hooks/usePopover'
import { useListbox } from '../../hooks/useListbox'
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
 *  Closes on outside-click and Escape through usePopover, mirroring the Menu
 *  primitive.
 *
 *  The keyboard is `useListbox`: arrows, Home, End, Enter, Space and typeahead,
 *  with focus staying on the trigger and the highlight announced through
 *  aria-activedescendant. That is why the trigger is a combobox rather than a
 *  button, and why the options are list items: `role="option"` has to be a direct
 *  child of the listbox, so nothing focusable can sit in between. */
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
  const baseId = useId()

  const selectedIndex = options.findIndex(o => o.key === value)
  const current = options[selectedIndex]
  const labels = useMemo(() => options.map(o => o.label), [options])

  const listbox = useListbox({
    open,
    labels,
    selectedIndex,
    onSelect: index => {
      setOpen(false)
      onChange(options[index].key)
    },
    onOpenChange: setOpen,
    baseId,
  })

  return (
    <div className={[styles.root, block ? styles.block : ''].filter(Boolean).join(' ')} ref={ref}>
      <TriggerPill
        block={block}
        role="combobox"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listbox.controls}
        aria-activedescendant={listbox.activeDescendant}
        onClick={() => toggle()}
        onKeyDown={listbox.onKeyDown}
      >
        <span className={styles.label}>
          {prefix && <span className={styles.prefix}>{prefix} </span>}
          {current?.label}
        </span>
        <FontAwesomeIcon icon={faChevronDown} className={styles.caret} />
      </TriggerPill>
      {open && (
        <Popover align={align === 'right' ? 'right' : 'stretch'} pad="tight">
          <ul id={listbox.listId} role="listbox" aria-label={ariaLabel} className={styles.list}>
            {options.map((o, i) => (
              <MenuOption
                as="li"
                key={o.key}
                id={listbox.optionId(i)}
                role="option"
                aria-selected={i === selectedIndex}
                label={o.label}
                selected={i === selectedIndex}
                active={i === listbox.activeIndex}
                // The trigger keeps focus, so a press here must not take it away
                // before the click lands.
                onMouseDown={e => e.preventDefault()}
                onMouseMove={() => listbox.setActiveIndex(i)}
                onClick={() => {
                  setOpen(false)
                  onChange(o.key)
                }}
              />
            ))}
          </ul>
        </Popover>
      )}
    </div>
  )
}
