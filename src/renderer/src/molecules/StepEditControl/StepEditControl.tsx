import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSliders } from '@fortawesome/free-solid-svg-icons'
import { IconButton } from '../../atoms/IconButton/IconButton'
import { Input } from '../../atoms/Input/Input'
import { Select } from '../../molecules/Select/Select'
import { usePopover } from '../../hooks/usePopover'
import { Popover } from '../../atoms/Popover/Popover'
import styles from './StepEditControl.module.css'

/** The per-step editor in a type scale: an icon button opening a panel of four
 *  fields. The panel is width="md" because its rows are not narrower than
 *  UnitsControl's: a 120 control, a 12 gap and a label. At sm, 180, the label
 *  column came to 16px and "Line height" had nowhere to go. */
interface StepEditControlProps {
  size: number
  weight: number
  lineHeight: string
  letterSpacing: string
  onChange: (size: number, weight: number, lineHeight: string, letterSpacing: string) => void
  /** The step being edited, so each row's button and panel are named for their own
   *  step. A table of steps otherwise gave every row the same "Edit step". */
  stepName?: string
}

const WEIGHTS = [100, 200, 300, 400, 500, 600, 700, 800, 900]

export function StepEditControl({
  size,
  weight,
  lineHeight,
  letterSpacing,
  onChange,
  stepName,
}: StepEditControlProps): React.ReactElement {
  const { open, toggle, ref } = usePopover()

  return (
    <div className={styles.root} ref={ref}>
      <IconButton label={stepName ? `Edit ${stepName}` : 'Edit step'} size="sm" onClick={toggle} aria-expanded={open}>
        <FontAwesomeIcon icon={faSliders} />
      </IconButton>
      {open && (
        <Popover align="right" width="md" role="dialog" ariaLabel={stepName ? `Edit ${stepName}` : 'Edit step'}>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Size</span>
            <span className={styles.unitField}>
              <input
                type="number"
                min={6}
                max={200}
                value={size}
                onChange={e => onChange(Number(e.target.value) || size, weight, lineHeight, letterSpacing)}
                className={styles.unitInput}
              />
              <span className={styles.unit}>px</span>
            </span>
          </label>
          <div className={styles.field}>
            <span className={styles.fieldLabel}>Weight</span>
            <span className={styles.controlBox}>
              <Select
                block
                ariaLabel="Weight"
                value={String(weight)}
                options={WEIGHTS.map(w => ({ key: String(w), label: String(w) }))}
                onChange={k => onChange(size, Number(k), lineHeight, letterSpacing)}
              />
            </span>
          </div>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Line height</span>
            <Input
              mono
              value={lineHeight}
              onChange={e => onChange(size, weight, e.target.value, letterSpacing)}
              className={styles.control}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Tracking</span>
            <Input
              mono
              value={letterSpacing}
              onChange={e => onChange(size, weight, lineHeight, e.target.value)}
              className={styles.control}
            />
          </label>
        </Popover>
      )}
    </div>
  )
}
