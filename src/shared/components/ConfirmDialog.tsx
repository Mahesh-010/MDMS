import { Modal } from './Modal'
import type { ModalProps } from './Modal'

export interface ConfirmDialogProps
  extends Pick<ModalProps, 'open' | 'onOpenChange' | 'title' | 'description'> {
  children?: ModalProps['children']
  confirmLabel?: string
  cancelLabel?: string
  isConfirming?: boolean
  onConfirm: () => void
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isConfirming = false,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      closeOnBackdrop={!isConfirming}
      footer={
        <div className="confirm-dialog-actions">
          <button
            type="button"
            className="ui-button ui-button--secondary"
            disabled={isConfirming}
            onClick={() => onOpenChange(false)}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className="ui-button ui-button--danger"
            disabled={isConfirming}
            onClick={onConfirm}
          >
            {isConfirming ? 'Please wait…' : confirmLabel}
          </button>
        </div>
      }
    >
      {children}
    </Modal>
  )
}
