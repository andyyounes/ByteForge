'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { clsx } from 'clsx'

interface ModalProps {
  open:     boolean
  onClose:  () => void
  title?:   string
  size?:    'sm' | 'md' | 'lg' | 'xl'
  children: ReactNode
  className?: string
}

const sizeMap = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
}

export function Modal({
  open,
  onClose,
  title,
  size = 'md',
  children,
  className,
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open) {
      if (!dialog.open) dialog.showModal()
    } else {
      if (dialog.open) dialog.close()
    }
  }, [open])

  // Close on backdrop click
  const handleClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) onClose()
  }

  // Close on Escape is handled natively by <dialog>
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    const handler = () => onClose()
    dialog.addEventListener('close', handler)
    return () => dialog.removeEventListener('close', handler)
  }, [onClose])

  return (
    <dialog
      ref={dialogRef}
      onClick={handleClick}
      className={clsx(
        'w-full rounded-lg border border-border bg-bg-card p-0',
        'shadow-[0_24px_80px_rgba(0,0,0,0.6)]',
        'backdrop:bg-black/60 backdrop:backdrop-blur-sm',
        'open:animate-fade-in-up',
        sizeMap[size],
        className
      )}
    >
      {title && (
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-fg">{title}</h2>
          <button
            onClick={onClose}
            className="text-fg-faint hover:text-fg transition-colors p-1 rounded-md hover:bg-bg-raised"
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
      )}
      <div className="p-6">{children}</div>
    </dialog>
  )
}
