// Vehicle and inspection related types

export interface VehicleOwner {
  name: string
  mask_phone?: string
  phone?: string
}

export interface VehicleFlag {
  type: 'warning' | 'danger' | 'info'
  code: string
  message: string
}

export interface Vehicle {
  id?: string | number
  plate_number: string
  side_number?: string
  status: 'valid' | 'expiring_soon' | 'expired' | 'suspended' | 'unknown'
  license_expiry?: string
  owner?: VehicleOwner
  flags?: VehicleFlag[]
  vehicle_type?: string
  make?: string
  model?: string
  color?: string
  year?: number
}

export interface InspectionAction {
  action: 'ok' | 'flag'
  note?: string
  timestamp?: number
  photoUri?: string
}

export interface InspectionResult {
  vehicle: Vehicle
  inspectedAt: number
  action?: InspectionAction
  syncStatus: 'pending' | 'synced' | 'failed' | 'unknown'
  queueId?: string
}

export interface RecentScan {
  code: string
  result?: Vehicle | null
  when: number
  syncStatus?: 'pending' | 'synced' | 'failed' | 'unknown'
  queueId?: string
  action?: InspectionAction
}

export interface AuthResponse {
  token: string
  refreshToken?: string
  expiresAt?: number
}

export interface ApiError {
  code: string
  message: string
  details?: Record<string, unknown>
}

// Navigation types
export type RootStackParamList = {
  Login: undefined
  Register: undefined
  Scanner: undefined
  Verify: { code: string; fromRecent?: boolean }
  Recent: undefined
  Settings: undefined
}
