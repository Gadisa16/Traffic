import { useRouter } from 'next/router'
import { useState } from 'react'
import api from '../lib/api'
import { Vehicle } from '../types'
import Spinner from './Spinner'
import { useToast } from './Toast'

interface Props {
  initial?: Vehicle
  onSaved?: (v: Vehicle) => void
}

export default function VehicleForm({ initial, onSaved }: Props) {
  const router = useRouter()
  const [plate, setPlate] = useState(initial?.plate_number || '')
  const [ownerName, setOwnerName] = useState(initial?.owner?.full_name || '')
  const [ownerPhone, setOwnerPhone] = useState(initial?.owner?.phone || '')
  const [sideNumber, setSideNumber] = useState(initial?.side_number || '')
  const [startDate, setStartDate] = useState(initial?.license?.start_date || '')
  const [expiryDate, setExpiryDate] = useState(initial?.license?.expiry_date || '')
  const [status, setStatus] = useState(initial?.status || 'active')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{ [k: string]: string }>({})
  const { push } = useToast()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const errs: { [k: string]: string } = {}
    if (!plate) errs.plate = 'Plate number is required'
    // basic plate validation: alphanumeric, dash, space
    if (plate && !/^[A-Z0-9 -]{1,16}$/i.test(plate)) errs.plate = 'Invalid plate format'
    if (!ownerName) errs.ownerName = 'Owner name is required'
    // side number: required and must be exactly 4 digits
    if (!sideNumber) errs.sideNumber = 'Side number is required'
    if (sideNumber && !/^[0-9]{4}$/.test(sideNumber)) errs.sideNumber = 'Side number must be 4 digits'
    setFieldErrors(errs)
    if (Object.keys(errs).length > 0) return setError('Fix validation errors')
    setSaving(true)
    try {
      const payload: Partial<Vehicle> = {
        plate_number: plate,
        side_number: sideNumber,
        status: status as Vehicle['status'],
        owner: {
          full_name: ownerName,
          phone: ownerPhone,
        },
        license: startDate || expiryDate ? { start_date: startDate, expiry_date: expiryDate } : undefined,
      }

      let saved: Vehicle
      if (initial?.id) {
        // optimistic: show saving toast then await
        saved = await api.updateVehicle(initial.id as number, payload)
        push('Vehicle updated', 'success')
      } else {
        saved = await api.createVehicle(payload)
        push('Vehicle created', 'success')
      }

      onSaved?.(saved)
      router.push('/vehicles')
    } catch (err: unknown) {
      if (typeof err === 'string') {
        setError(err)
        push(err, 'error')
      } else if (typeof err === 'object' && err && 'message' in err) {
        const m = (err as { message?: unknown }).message
        const msg = typeof m === 'string' ? m : String(m)
        setError(msg)
        push(msg, 'error')
      } else {
        setError('Failed to save')
        push('Failed to save', 'error')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card p-4 space-y-3">
      {error && <div className="text-red-600">{error}</div>}

      <div>
        <label className="block text-sm font-medium">Plate number</label>
        <input value={plate} onChange={e => setPlate(e.target.value)} className="mt-1 block w-full border rounded px-2 py-1" />
        {fieldErrors.plate && <div className="text-xs text-red-600 mt-1">{fieldErrors.plate}</div>}
      </div>

      <div>
        <label className="block text-sm font-medium">Side number (የጉን ቁጥር)</label>
        <input value={sideNumber} onChange={e => setSideNumber(e.target.value)} maxLength={4} className="mt-1 block w-full border rounded px-2 py-1" />
        {fieldErrors.sideNumber && <div className="text-xs text-red-600 mt-1">{fieldErrors.sideNumber}</div>}
      </div>

      <div>
        <label className="block text-sm font-medium">Owner name</label>
        <input value={ownerName} onChange={e => setOwnerName(e.target.value)} className="mt-1 block w-full border rounded px-2 py-1" />
        {fieldErrors.ownerName && <div className="text-xs text-red-600 mt-1">{fieldErrors.ownerName}</div>}
      </div>

      <div>
        <label className="block text-sm font-medium">Owner phone</label>
        <input value={ownerPhone} onChange={e => setOwnerPhone(e.target.value)} className="mt-1 block w-full border rounded px-2 py-1" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium">License start</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="mt-1 block w-full border rounded px-2 py-1" />
        </div>
        <div>
          <label className="block text-sm font-medium">License expiry</label>
          <input type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} className="mt-1 block w-full border rounded px-2 py-1" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium">Status</label>
        <select value={status} onChange={e => setStatus(e.target.value)} className="mt-1 block w-full border rounded px-2 py-1">
          <option value="active">Active</option>
          <option value="expired">Expired</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <button type="submit" disabled={saving} className="btn btn-primary disabled:opacity-60 flex items-center gap-2">
          {saving ? <><Spinner size={3} /><span>Saving…</span></> : (initial?.id ? 'Update Vehicle' : 'Create Vehicle')}
        </button>
        <button type="button" onClick={() => router.push('/vehicles')} className="btn">Cancel</button>
      </div>
    </form>
  )
}
