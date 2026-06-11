import React from 'react'
import styles from './FontPreviewBar.module.css'

interface FontPreviewBarProps {
  text: string
  size: number
  onTextChange: (text: string) => void
  onSizeChange: (size: number) => void
}

export function FontPreviewBar({ text, size, onTextChange, onSizeChange }: FontPreviewBarProps): React.ReactElement {
  return (
    <div className={styles.bar}>
      <input
        className={styles.input}
        value={text}
        onChange={e => onTextChange(e.target.value)}
        placeholder="The quick brown fox jumps over the lazy dog"
        aria-label="Preview text"
      />
      <div className={styles.sizeControl}>
        <input
          type="range"
          min={12}
          max={48}
          value={size}
          onChange={e => onSizeChange(Number(e.target.value))}
          className={styles.slider}
          aria-label="Preview size"
        />
        <span className={styles.sizeValue}>{size}px</span>
      </div>
    </div>
  )
}
