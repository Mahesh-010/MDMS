import type { ReactNode } from 'react'
import { Modal } from '../Modal'
import '../Modal/Modal.css'

export interface ConfirmDialogProps {
  open: boolean
  title: string
  message: ReactNode
  onConfirm: () => void
  onCancel: () => void
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  disabled?: boolean
  closeOnBackdrop?: boolean
  closeOnEscape?: boolean
}

export function ConfirmDialog({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  disabled = false,
  closeOnBackdrop = true,
  closeOnEscape = true,
}: ConfirmDialogProps) {
  const footer = (
    <>
      <button
        type="button"
        className="mdms-modal__action mdms-modal__action--secondary"
        onClick={onCancel}
      >
        {cancelLabel}
      </button>
      <button
        type="button"
        className={`mdms-modal__action ${
          destructive
            ? 'mdms-modal__action--destructive'
            : 'mdms-modal__action--primary'
        }`}
        onClick={onConfirm}
        disabled={disabled}
      >
        {confirmLabel}
      </button>
    </>
  )

  return (
    <Modal
      open={open}
      title={title}
      onClose={onCancel}
      footer={footer}
      closeOnBackdrop={closeOnBackdrop}
      closeOnEscape={closeOnEscape}
    >
      <p className="mdms-confirm-dialog__message">{message}</p>
    </Modal>
  )
}
