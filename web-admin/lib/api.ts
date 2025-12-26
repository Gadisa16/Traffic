import { ApiError, Paginated, Token, UserOut, Vehicle } from '../types'

const getBase = () => process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

async function fetchJson<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const url = `${getBase()}${path}`
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(opts.headers as Record<string, string> || {}),
  }

  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(url, { ...opts, headers })
  const text = await res.text()
  const data = text ? JSON.parse(text) : null
  if (!res.ok) {
    const err: ApiError = (data && data.detail) ? { message: data.detail } : { message: res.statusText }
    throw err
  }
  return data as T
}

// Auth
export async function login(username: string, password: string): Promise<Token> {
  // backend expects OAuth2 form-encoded body. Use form encoding.
  const body = new URLSearchParams()
  body.set('username', username)
  body.set('password', password)
  body.set('grant_type', 'password')
  const token = await fetchJson<Token>('/auth/login', {
    method: 'POST',
    body: body.toString(),
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
  if (typeof window !== 'undefined') {
    localStorage.setItem('access_token', token.access_token)
  }
  return token
}

export function logout(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('access_token')
  }
}

// Vehicles
export async function getVehicles(plate?: string, side?: string): Promise<Vehicle[]> {
  const qs: string[] = []
  if (plate) qs.push(`plate=${encodeURIComponent(plate)}`)
  if (side) qs.push(`side=${encodeURIComponent(side)}`)
  const path = qs.length ? `/vehicles?${qs.join('&')}` : '/vehicles'
  return fetchJson<Vehicle[]>(path)
}

export async function getVehicleByPlate(plate: string): Promise<Vehicle> {
  return fetchJson<Vehicle>(`/vehicles/by_plate/${encodeURIComponent(plate)}`)
}

export async function getVehicleByQR(qr: string): Promise<Vehicle> {
  return fetchJson<Vehicle>(`/vehicles/by_qr/${encodeURIComponent(qr)}`)
}

export async function getVehicleBySide(side: string): Promise<Vehicle> {
  return fetchJson<Vehicle>(`/vehicles/by_side/${encodeURIComponent(side)}`)
}

export async function getVehicle(id: number): Promise<Vehicle> {
  return fetchJson<Vehicle>(`/vehicles/${id}`)
}

export async function getCurrentUser(): Promise<UserOut> {
  return fetchJson<UserOut>('/auth/me')
}

export async function refreshToken(): Promise<Token> {
  return fetchJson<Token>('/auth/refresh', { method: 'POST' })
}

export async function createVehicle(payload: Partial<Vehicle>): Promise<Vehicle> {
  return fetchJson<Vehicle>('/vehicles', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateVehicle(id: number, payload: Partial<Vehicle>): Promise<Vehicle> {
  return fetchJson<Vehicle>(`/vehicles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export async function deleteVehicle(id: number): Promise<void> {
  await fetchJson<void>(`/vehicles/${id}`, { method: 'DELETE' })
}

export async function getDeletedVehicles(): Promise<Vehicle[]> {
  return fetchJson<Vehicle[]>('/vehicles/deleted')
}

export async function purgeVehicle(id: number): Promise<void> {
  await fetchJson<void>(`/vehicles/${id}/purge`, { method: 'POST' })
}

export async function undeleteVehicle(id: number): Promise<void> {
  await fetchJson<void>(`/vehicles/${id}/undelete`, { method: 'POST' })
}

// Helpers for paginated endpoints (example)
export async function getVehiclesPaginated(page = 1, per_page = 20): Promise<Paginated<Vehicle>> {
  return fetchJson<Paginated<Vehicle>>(`/vehicles?page=${page}&per_page=${per_page}`)
}

const api = {
  login,
  logout,
  getVehicles,
  getVehicleByPlate,
  getVehicleByQR,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  getDeletedVehicles,
  purgeVehicle,
  undeleteVehicle,
  getVehiclesPaginated,
}

export default api
