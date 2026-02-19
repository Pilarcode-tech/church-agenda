'use client'

import { createContext, useState, useCallback } from 'react'
import { CircleCheck, CircleX, Info, X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info'

type Toast = {
  id: number
  message: string
  type: ToastType
}

type ToastContextValue = {
  toast: (message: string, type?: ToastType) => void
}

export const ToastContext = createContext<ToastContextValue>({
  toast: () => {},
})

let nextId = 0

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = nextId++
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }, [])

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      {/* Toast container */}
      <div className="fixed bottom-6 right-6 z-[200] flex flex-col-reverse gap-2 pointer-events-none">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

const icons: Record<ToastType, React.ReactNode> = {
  success: <CircleCheck size={18} className="text-green-600 shrink-0" />,
  error: <CircleX size={18} className="text-red-600 shrink-0" />,
  info: <Info size={18} className="text-brand-accent shrink-0" />,
}

const barColors: Record<ToastType, string> = {
  success: 'bg-green-500',
  error: 'bg-red-500',
  info: 'bg-brand-accent',
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: number) => void }) {
  return (
    <div
      className="pointer-events-auto bg-brand-white border border-brand-border rounded-xl shadow-lg px-4 py-3 flex items-start gap-3 min-w-[280px] max-w-[380px] animate-slideUp relative overflow-hidden"
    >
      {icons[toast.type]}
      <p className="text-sm text-brand-text flex-1">{toast.message}</p>
      <button
        onClick={() => onDismiss(toast.id)}
        className="text-brand-dim hover:text-brand-text shrink-0"
      >
        <X size={14} />
      </button>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5">
        <div
          className={`h-full ${barColors[toast.type]} animate-shrink`}
        />
      </div>
    </div>
  )
}
