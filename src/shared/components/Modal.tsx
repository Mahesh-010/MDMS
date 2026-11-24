import { useEffect, useId, useRef, type MouseEvent, type ReactNode } from 'react'
import './SharedUi.css'

export interface ModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  children: ReactNode
  description?: string
  footer?: ReactNode
  closeOnBackdrop?: boolean
}

export function Modal({
  open,
  onOpenChange,
  title,
  children,
  description,
  footer,
  closeOnBackdrop = true,
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const descriptionId = useId()

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (open && !dialog.open) {
      dialog.showModal()
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open])

  function handleBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    if (closeOnBackdrop && event.target === event.currentTarget) {
      onOpenChange(false)
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="ui-modal"
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onClick={handleBackdropClick}
      onCancel={() => onOpenChange(false)}
      onClose={() => {
        if (open) onOpenChange(false)
      }}
    >
      <section className="ui-modal-panel">
        <header className="ui-modal-header">
          <div>
            <h2 id={titleId}>{title}</h2>
            {description && <p id={descriptionId}>{description}</p>}
          </div>
          <button
            type="button"
            className="ui-modal-close"
            aria-label="Close dialog"
            onClick={() => onOpenChange(false)}
          >
            ×
          </button>
        </header>
        <div className="ui-modal-content">{children}</div>
        {footer && <footer className="ui-modal-footer">{footer}</footer>}
      </section>
    </dialog>
  )
}
