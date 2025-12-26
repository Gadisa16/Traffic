import { NextPage } from 'next'
import { useCallback, useEffect, useState } from 'react'
import ConfirmModal from '../../components/ConfirmModal'
import Layout from '../../components/Layout'
import { useToast } from '../../components/Toast'
import api from '../../lib/api'
import { RequireAuth } from '../../lib/useAuth'
import { Vehicle } from '../../types'

const TrashPage: NextPage = () => {
  const [vehicles, setVehicles] = useState<Vehicle[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState<number | null>(null)
  const { push } = useToast()

  const load = useCallback(() => {
    setLoading(true)
    api.getDeletedVehicles()
      .then(setVehicles)
      .catch((e: unknown) => {
        if (typeof e === 'string') push(e, 'error')
        else if (typeof e === 'object' && e && 'message' in e) {
          const m = (e as { message?: unknown }).message
          push(typeof m === 'string' ? m : String(m), 'error')
        } else push('Failed to load', 'error')
      })
      .finally(() => setLoading(false))
  }, [push])

  useEffect(() => { load() }, [load])

  if (loading) return <Layout><div className="p-6">Loading…</div></Layout>

  return (
    <Layout>
      <RequireAuth>
        <div className="p-6">
          <h1 className="text-2xl font-semibold mb-4">Trash</h1>
          {!vehicles || vehicles.length === 0 ? (
            <div className="surface rounded shadow p-6">No deleted vehicles</div>
          ) : (
            <ul className="space-y-2">
              {vehicles.map(v => (
                <li key={v.id} className="surface rounded p-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium">{v.plate_number}</div>
                    <div className="text-sm text-gray-500">{v.owner?.full_name}</div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={async () => { await api.undeleteVehicle(v.id as number); push('Restored', 'success'); load() }} className="px-3 py-1 rounded border">Restore</button>
                    <button onClick={() => setDeleting(v.id as number)} className="px-3 py-1 rounded bg-red-600 text-white">Purge</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <ConfirmModal
          open={!!deleting}
          message={`Permanently delete vehicle?`}
          onCancel={() => setDeleting(null)}
          onConfirm={async () => {
            if (!deleting) return setDeleting(null)
            try {
              await api.purgeVehicle(deleting)
              push('Permanently deleted', 'success')
              load()
              } catch (e: unknown) {
              if (typeof e === 'string') push(e, 'error')
              else if (typeof e === 'object' && e && 'message' in e) {
                const m = (e as { message?: unknown }).message
                push(typeof m === 'string' ? m : String(m), 'error')
              } else push('Failed to purge', 'error')
            } finally {
              setDeleting(null)
            }
          }}
        />
      </RequireAuth>
    </Layout>
  )
}

export default TrashPage
