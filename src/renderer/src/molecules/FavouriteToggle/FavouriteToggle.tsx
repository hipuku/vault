import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faStar } from '@fortawesome/free-solid-svg-icons'
import styles from './FavouriteToggle.module.css'

interface FavouriteToggleProps {
  active: boolean
  onToggle: () => void
}

/** Toolbar pill that filters a section to favourites only. Shared across sections. */
export function FavouriteToggle({ active, onToggle }: FavouriteToggleProps): React.ReactElement {
  return (
    <button
      type="button"
      className={[styles.toggle, active ? styles.on : ''].filter(Boolean).join(' ')}
      onClick={onToggle}
      aria-pressed={active}
    >
      <FontAwesomeIcon icon={faStar} />
      Favourites
    </button>
  )
}
