import { createContext, ReactNode, useContext, useRef, useState } from 'react';

type ToastAction = { label: string; onClick: () => void }
type Toast = { id: number; message: string; type?: 'success' | 'error' | 'info'; action?: ToastAction }

const ToastContext = createContext<{
  push: (message: string, type?: Toast['type'], opts?: { duration?: number; action?: ToastAction }) => number
  remove: (id: number) => void
}>({ push: () => -1, remove: () => {} })

let idCounter = 1

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const timers = useRef<Map<number, number>>(new Map())

  function remove(id: number) {
    setToasts(s => s.filter(x => x.id !== id))
    const t = timers.current.get(id)
    if (t) {
      clearTimeout(t)
      timers.current.delete(id)
    }
  }

  function push(message: string, type: Toast['type'] = 'info', opts?: { duration?: number; action?: ToastAction }) {
    const id = idCounter++
    const t: Toast = { id, message, type, action: opts?.action }
    setToasts(s => [t, ...s])
    const duration = opts?.duration ?? 4000
    const timer = window.setTimeout(() => remove(id), duration)
    timers.current.set(id, timer as unknown as number)
    return id
  }

  return (
    <ToastContext.Provider value={{ push, remove }}>
      {children}
      <div className="fixed right-4 top-4 z-50 flex flex-col gap-3">
        {toasts.map(t => (
          <div key={t.id} className={`transform transition-all duration-200 ease-out max-w-sm w-full flex items-start gap-3 p-3 rounded-lg shadow-lg ${t.type === 'success' ? 'bg-white border-l-4 border-green-500' : t.type === 'error' ? 'bg-white border-l-4 border-red-500' : 'bg-white border-l-4 border-blue-500'}`}>
            <div className="mt-1">
              {t.type === 'success' ? (
                <svg className="w-5 h-5 text-green-500" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              ) : t.type === 'error' ? (
                <svg className="w-5 h-5 text-red-500" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              ) : (
                <svg className="w-5 h-5 text-blue-500" viewBox="0 0 24 24" fill="none"><path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              )}
            </div>

            <div className="flex-1">
              <div className="text-sm text-gray-900">{t.message}</div>
              {t.action && (
                <div className="mt-2">
                  <button onClick={() => { t.action?.onClick(); remove(t.id) }} className="text-sm text-blue-600 hover:underline">
                    {t.action.label}
                  </button>
                </div>
              )}
            </div>

            <div className="ml-2 mt-0.5">
              <button onClick={() => remove(t.id)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}

export default ToastProvider
