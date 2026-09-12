import React from 'react'
import { Button } from '../../atoms/Button/Button'
import Modal from '../../molecules/Modal/Modal'
import styles from './ConfirmDialog.module.css'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  /** 'alert' reports something and offers one primary button. A dialog that
   *  destroys nothing must not draw a danger button, and has nothing to cancel. */
  kind?: 'confirm' | 'alert'
  onConfirm: () => void
  onCancel: () => void
}

/**
 * Enter is deliberately not bound. It used to fire the destructive action from a
 * window listener, so a stray keystroke while the dialog appeared could delete
 * something with nothing focused to show for it. Modal focuses the first control in
 * the panel, which is Cancel, so Enter now does the safe thing by construction.
 */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Delete',
  kind = 'confirm',
  onConfirm,
  onCancel,
}: ConfirmDialogProps): React.ReactElement | null {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      size="sm"
      chrome="plain"
      footer={
        kind === 'alert' ? (
          <Button variant="primary" size="md" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        ) : (
          <>
            <Button variant="ghost" size="md" onClick={onCancel}>
              Cancel
            </Button>
            <Button variant="danger" size="md" onClick={onConfirm}>
              {confirmLabel}
            </Button>
          </>
        )
      }
    >
      <p className={styles.message}>{message}</p>
    </Modal>
  )
}
