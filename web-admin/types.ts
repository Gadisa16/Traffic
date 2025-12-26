// Shared types for the web-admin app

export type Role = 'admin' | 'inspector'

export type VehicleStatus = 'active' | 'expired' | 'suspended'

export interface Owner {
  id?: number
  full_name: string
  phone?: string
  address?: string
  // national ID should not be exposed to the client in production
  national_id?: string
}

export interface License {
  id?: number
  vehicle_id?: number
  start_date: string // ISO date
  expiry_date: string // ISO date
  renewal_status?: string
}

export interface Vehicle {
  id?: number
  plate_number: string
  side_number?: string
  qr_value?: string
  status?: VehicleStatus
  owner?: Owner
  license?: License
}

export interface Token {
  access_token: string
  token_type: 'bearer' | string
  expires_in?: number
}

export interface UserOut {
  id: number
  username: string
  role: Role
}

export interface ApiError {
  message: string
  code?: string
}

export interface Paginated<T> {
  data: T[]
  total: number
  page?: number
  per_page?: number
}

// Usage example:
// import { Vehicle } from '../types'
