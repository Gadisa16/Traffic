import Link from 'next/link'
import { useEffect, useState } from 'react'
import api from '../lib/api'
import { Vehicle } from '../types'
import ConfirmModal from './ConfirmModal'
import EmptyState from './EmptyState'
import Spinner from './Spinner'
import { useToast } from './Toast'

export default function VehicleList() {
  const getMessage = (err: unknown, fallback: string) => {
    if (typeof err === 'string') return err
    if (typeof err === 'object' && err && 'message' in err) {
      const m = (err as { message?: unknown }).message
      return typeof m === 'string' ? m : String(m)
    }
    return fallback
  }
  const [vehicles, setVehicles] = useState<Vehicle[] | null>(null)
  const [plateFilter, setPlateFilter] = useState('')
  const [sideFilter, setSideFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    api.getVehicles()
      .then(data => {
        if (!mounted) return
        setVehicles(data)
        setError(null)
      })
      .catch((err: unknown) => {
        if (!mounted) return
        const message = getMessage(err, 'Failed to load vehicles')
        setError(message)
        setVehicles([])
      })
      .finally(() => mounted && setLoading(false))

    return () => { mounted = false }
  }, [])

  // helper to reload list after create/update/delete
  const reload = (p?: string, s?: string) => {
    setLoading(true)
    api.getVehicles(p, s)
      .then(data => { setVehicles(data); setError(null) })
      .catch((err: unknown) => { setError(getMessage(err, 'Failed to load')); setVehicles([]) })
      .finally(() => setLoading(false))
  }

  // when filters are applied we fetch from server; otherwise use vehicles as-is
  const displayed = vehicles || []

  const [deleting, setDeleting] = useState<Vehicle | null>(null)
  const { push } = useToast()

  if (loading) return (
    <div className="surface rounded shadow p-6 max-w-2xl mx-auto flex items-center justify-center space-x-3">
      <Spinner size={4} />
      <div className="text-lg">Loading vehicles…</div>
    </div>
  )
  if (error) return <div className="surface rounded shadow p-6 max-w-2xl mx-auto text-red-600">{error}</div>
  if (!vehicles || vehicles.length === 0) return (
    <div className="max-w-2xl mx-auto py-6">
      <EmptyState title="No vehicles registered" message="No vehicle records exist. Register the first vehicle to manage inspections and licenses." cta={{ label: 'Register first vehicle', href: '/vehicles/create' }} />
    </div>
  )

  return (
    <div className="bg-white rounded shadow p-4">
      <div className="flex gap-2 mb-3">
        <input value={plateFilter} onChange={e => setPlateFilter(e.target.value)} placeholder="Search plate" className="border rounded px-2 py-1" />
        <input value={sideFilter} onChange={e => setSideFilter(e.target.value)} placeholder="Side # (exact)" maxLength={4} className="border rounded px-2 py-1 w-28" />
        <button onClick={() => reload(plateFilter || undefined, sideFilter || undefined)} className="px-2 py-1 border rounded">Search</button>
        <button onClick={() => { setPlateFilter(''); setSideFilter(''); reload() }} className="px-2 py-1 border rounded">Clear</button>
      </div>
      <div className="flex justify-end mb-3">
        <Link href="/vehicles/create" className="btn btn-primary">Create Vehicle</Link>
      </div>
      <ul>
        {displayed.map(v => (
          <li key={v.id} className="py-2 border-b">
            <div className="flex items-center justify-between">
              <div>
                  <div className="font-medium">{v.plate_number} <span className="ml-2 badge">{v.side_number || '—'}</span></div>
                  <div className="text-sm muted">{v.owner?.full_name || '—'} — expires {v.license?.expiry_date || '—'}</div>
              </div>
              <div className="flex gap-2">
                <Link href={`/vehicles/${v.id}`} className="text-sm px-2 py-1 border rounded">Edit</Link>
                <button
                  onClick={() => setDeleting(v)}
                  className="text-sm px-2 py-1 border rounded text-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <ConfirmModal
        open={!!deleting}
        message={`Delete vehicle ${deleting?.plate_number}?`}
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (!deleting?.id) return setDeleting(null)
          const id = deleting.id
          const prev = vehicles || []
          // optimistic remove from list
          setVehicles(prev.filter(x => x.id !== id))
          setDeleting(null)

          // perform soft-delete immediately
          api.deleteVehicle(id).then(() => {
            // already removed from list optimistically
            push('Vehicle deleted', 'success')
          }).catch((e: unknown) => {
            const msg = getMessage(e, 'Failed to delete')
            push(msg, 'error')
            // revert list on failure
            setVehicles(prev)
          })

          // show undo toast (calls undelete endpoint)
          push('Undo available', 'info', {
            duration: 5000,
            action: {
              label: 'Undo',
              onClick: async () => {
                try {
                  await api.undeleteVehicle(id)
                  // restore previous list
                  setVehicles(prev)
                  push('Delete undone', 'success')
                } catch (e: unknown) {
                  push(getMessage(e, 'Failed to undo'), 'error')
                }
              }
            }
          })
        }}
      />
    </div>
  )
}

