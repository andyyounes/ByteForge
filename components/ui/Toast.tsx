'use client'

// ── Toast notification system ─────────────────────────────────────────────────
// Usage:
//   const { toast } = useToast()
//   toast.success('Well done!')
//   toast.error('Something went wrong')
//   toast.xp(150, 'Binary Search mastered!')

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import { clsx } from 'clsx'
import { CheckIcon, XIcon, ZapIcon } from '@/components/ui/Icons'

type ToastType = 'success' | 'error' | 'info' | 'xp'

interface ToastItem {
  id:      string
  type:    ToastType
  message: string
  xp?:     number
}

interface ToastContextValue {
  toast: {
    success: (msg: string) => void
    error:   (msg: string) => void
    info:    (msg: string) => void
    xp:      (amount: number, msg?: string) => void
  }
}

const ToastContext = createContext<ToastContextValue | null>(null)

// SVG icon per type — no emoji
const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckIcon size={14} strokeWidth={2.2} />,
  error:   <XIcon    size={14} strokeWidth={2.2} />,
  info:    <span className="text-[11px] font-bold leading-none">i</span>,
  xp:      <ZapIcon  size={14} strokeWidth={2} />,
}

// Left-border colour per type — uses design-token colours
const BORDER_COLOUR: Record<ToastType, string> = {
  success: 'border-l-emerald',
  error:   'border-l-rose',
  info:    'border-l-sky',
  xp:      'border-l-amber',
}

const ICON_COLOUR: Record<ToastType, string> = {
  success: 'text-emerald',
  error:   'text-rose',
  info:    'text-sky',
  xp:      'text-amber',
}

function uid(): string {
  return Math.random().toString(36).slice(2, 9)
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const add = useCallback((item: Omit<ToastItem, 'id'>) => {
    const id = uid()
    setToasts(prev => [...prev, { ...item, id }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 4000)
  }, [])

  const toast = {
    success: (msg: string)              => add({ type: 'success', message: msg }),
    error:   (msg: string)              => add({ type: 'error',   message: msg }),
    info:    (msg: string)              => add({ type: 'info',    message: msg }),
    xp:      (amount: number, msg = '') => add({ type: 'xp',      message: msg || `+${amount} XP`, xp: amount }),
  }

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      {/* Toast portal */}
      <div
        className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none"
        aria-live="polite"
        aria-label="Notifications"
      >
        {toasts.map(t => (
          <div
            key={t.id}
            className={clsx(
              'pointer-events-auto flex items-center gap-3',
              'bg-s2 border border-b2 border-l-4 rounded-lg px-4 py-3',
              'shadow-overlay animate-slide-right',
              'min-w-[260px] max-w-[360px]',
              BORDER_COLOUR[t.type],
            )}
          >
            {/* Icon */}
            <span className={clsx('shrink-0', ICON_COLOUR[t.type])}>
              {ICONS[t.type]}
            </span>

            {/* Message */}
            <span className="text-sm text-fg leading-snug flex-1">{t.message}</span>

            {/* XP amount */}
            {t.xp != null && (
              <span className="text-amber font-bold text-sm shrink-0 tabular-nums">
                +{t.xp}
              </span>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be inside <ToastProvider>')
  return ctx
}
