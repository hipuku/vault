import { useState, useCallback, useRef } from 'react'

interface ConfirmOptions {
  title: string
  message: string
  confirmLabel?: string
}

interface ConfirmState extends ConfirmOptions {
  resolve: (value: boolean) => void
}

export function useConfirm(): {
  confirm: (opts: ConfirmOptions) => Promise<boolean>
  isOpen: boolean
  title: string
  message: string
  confirmLabel: string
  onConfirm: () => void
  onCancel: () => void
} {
  const [state, setState] = useState<ConfirmState | null>(null)
  const resolveRef = useRef<((value: boolean) => void) | null>(null)

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    return new Promise(resolve => {
      resolveRef.current = resolve
      setState({ ...opts, resolve })
    })
  }, [])

  const onConfirm = useCallback((): void => {
    resolveRef.current?.(true)
    setState(null)
  }, [])

  const onCancel = useCallback((): void => {
    resolveRef.current?.(false)
    setState(null)
  }, [])

  return {
    confirm,
    isOpen: state !== null,
    title: state?.title ?? '',
    message: state?.message ?? '',
    confirmLabel: state?.confirmLabel ?? 'Delete',
    onConfirm,
    onCancel,
  }
}
