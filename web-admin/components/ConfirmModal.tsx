
import { useEffect, useRef } from 'react';

export default function ConfirmModal({ open, message, onConfirm, onCancel }: { open: boolean; message: string; onConfirm: () => void; onCancel: () => void }) {
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const confirmRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    if (!open) return
    const timer = setTimeout(() => confirmRef.current?.focus(), 50)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
      if (e.key === 'Tab') {
        const nodes = dialogRef.current?.querySelectorAll<HTMLElement>('button, [href], input, select, textarea')
        if (!nodes || nodes.length === 0) return
        const first = nodes[0]
        const last = nodes[nodes.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          (last as HTMLElement).focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          (first as HTMLElement).focus()
        }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => { clearTimeout(timer); document.removeEventListener('keydown', onKey) }
  }, [open, onCancel])

  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" role="presentation" aria-hidden={!open}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="confirm-title" className="bg-white dark:bg-[#071332] rounded shadow p-4 w-80">
        <div id="confirm-title" className="text-lg font-medium mb-2">Confirm</div>
        <div className="mb-4 text-sm text-gray-700 dark:text-gray-200">{message}</div>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="px-3 py-1 rounded border" aria-label="Cancel">Cancel</button>
          <button ref={confirmRef} onClick={onConfirm} className="px-3 py-1 rounded bg-red-600 text-white" aria-label="Confirm delete">Delete</button>
        </div>
      </div>
    </div>
  )
}
