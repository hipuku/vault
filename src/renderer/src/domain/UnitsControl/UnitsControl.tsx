import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSliders } from '@fortawesome/free-solid-svg-icons'
import { Select } from '../../primitives/Select/Select'
import type {
  TypeUnits, SizeUnit, WeightDisplay, LineHeightUnit, TrackingUnit,
} from '../../lib/typeUnits'
import { usePopover } from '../../hooks/usePopover'
import { Popover } from '../../primitives/Popover/Popover'
import styles from './UnitsControl.module.css'

interface UnitsControlProps {
  units: TypeUnits
  onChange: (units: TypeUnits) => void
}

const SIZE_OPTS: Array<{ key: SizeUnit; label: string }> = [
  { key: 'px', label: 'px' }, { key: 'rem', label: 'rem' }, { key: 'pt', label: 'pt' },
]
const WEIGHT_OPTS: Array<{ key: WeightDisplay; label: string }> = [
  { key: 'number', label: 'Number (400)' }, { key: 'name', label: 'Name (Regular)' },
]
const LH_OPTS: Array<{ key: LineHeightUnit; label: string }> = [
  { key: 'unitless', label: 'unitless' }, { key: 'px', label: 'px' }, { key: '%', label: '%' },
]
const TRACKING_OPTS: Array<{ key: TrackingUnit; label: string }> = [
  { key: 'em', label: 'em' }, { key: 'px', label: 'px' }, { key: '%', label: '%' },
]

/** Compact popover that sets the table's display units — mirrors FontPreviewControl. */
export function UnitsControl({ units, onChange }: UnitsControlProps): React.ReactElement {
  const { open, toggle, ref } = usePopover()

  return (
    <div className={styles.root} ref={ref}>
      <button
        type="button"
        className={styles.trigger}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={toggle}
      >
        <FontAwesomeIcon icon={faSliders} />
        <span className={styles.summary}>{units.size} · {units.tracking}</span>
      </button>

      {open && (
        <Popover align="right" width="md" column role="dialog" ariaLabel="Display units">
          <div className={styles.row}>
            <span className={styles.label}>Size</span>
            <Select block ariaLabel="Size unit" value={units.size} options={SIZE_OPTS}
              onChange={size => onChange({ ...units, size })} />
          </div>
          <div className={styles.row}>
            <span className={styles.label}>Weight</span>
            <Select block ariaLabel="Weight display" value={units.weight} options={WEIGHT_OPTS}
              onChange={weight => onChange({ ...units, weight })} />
          </div>
          <div className={styles.row}>
            <span className={styles.label}>Line height</span>
            <Select block ariaLabel="Line-height unit" value={units.lineHeight} options={LH_OPTS}
              onChange={lineHeight => onChange({ ...units, lineHeight })} />
          </div>
          <div className={styles.row}>
            <span className={styles.label}>Tracking</span>
            <Select block ariaLabel="Tracking unit" value={units.tracking} options={TRACKING_OPTS}
              onChange={tracking => onChange({ ...units, tracking })} />
          </div>
        </Popover>
      )}
    </div>
  )
}
