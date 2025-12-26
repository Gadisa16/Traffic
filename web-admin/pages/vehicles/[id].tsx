import { NextPage } from 'next'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import VehicleForm from '../../components/VehicleForm'
import api from '../../lib/api'
import { RequireAuth } from '../../lib/useAuth'
import { Vehicle } from '../../types'

const EditPage: NextPage = () => {
  const router = useRouter()
  const { id } = router.query
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    const vid = Number(id)
    if (isNaN(vid)) { setTimeout(() => setError('Invalid id'), 0); return }
    api.getVehicle(vid)
      .then(v => setVehicle(v))
      .catch((e: unknown) => {
        if (typeof e === 'string') return setError(e)
        if (typeof e === 'object' && e && 'message' in e) {
          const m = (e as { message?: unknown }).message
          return setError(typeof m === 'string' ? m : String(m))
        }
        return setError('Failed to load')
      })
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="p-4">Loading…</div>
  if (error) return <div className="p-4 text-red-600">{error}</div>
  if (!vehicle) return <div className="p-4">No vehicle found</div>

  return (
    <RequireAuth>
      <div className="max-w-2xl mx-auto py-6">
        <h1 className="text-2xl font-bold mb-4">Edit Vehicle</h1>
        <div className="mb-3">
          <span className="inline-block text-sm text-gray-600 mr-2">Side Number</span>
          <span className="inline-block bg-blue-600 text-white px-3 py-1 rounded font-medium">{vehicle.side_number || '—'}</span>
        </div>
        <VehicleForm initial={vehicle} />
      </div>
    </RequireAuth>
  )
}

export default EditPage
