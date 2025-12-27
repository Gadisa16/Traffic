import axios from 'axios'
import * as Storage from './storage'

// Default backend host; override for local device testing
const BACKEND_HOST = (process.env.EXPO_PUBLIC_API_URL || 'http://127.0.0.1:8000')
const client = axios.create({ baseURL: BACKEND_HOST, timeout: 10000 })

// simple session expired callback (set by app)
let onSessionExpired: (() => void) | null = null
export function setOnSessionExpired(fn: (() => void) | null) { onSessionExpired = fn }

// attach authorization header from storage; proactively refresh if close to expiry
client.interceptors.request.use(async (cfg) => {
  try {
    const token = (await Storage.getAuth())?.token
    if (token) {
      cfg.headers = cfg.headers || {}
        ; (cfg.headers as any).Authorization = `Bearer ${token}`
    }
  } catch (e) {
    // if session expired triggered a cancel, propagate
    throw e
  }
  return cfg
})
// response interceptor to reset session on 401
client.interceptors.response.use(undefined, async (err) => {
  if (err?.response?.status === 401) {
    try { await Storage.clearToken() } catch (e) { }
    if (onSessionExpired) onSessionExpired()
  }
  return Promise.reject(err)
})

export async function verifyVehicle(code: string) {
  try {
    const res = await client.get(`/vehicles/verify`, { params: { code } })
    return res.data
  } catch (err: any) {
    throw err
  }
}

export async function recordScan(code: string, payload: any = {}) {
  // If a photo is included, upload as multipart/form-data
  try {
    if (payload.photoUri) {
      const form = new FormData()
      form.append('code', code)
      if (payload.when) form.append('when', String(payload.when))
      // include other payload fields as JSON string
      if (payload.payload) form.append('payload', JSON.stringify(payload.payload))

      const uri: string = payload.photoUri
      const name = uri.split('/').pop() || `photo.jpg`
      const type = 'image/jpeg'
      // @ts-ignore - React Native/Expo expects an object with uri, name, type
      form.append('photo', { uri, name, type })

      // Let axios set multipart boundary headers
      const res = await client.post('/inspections', form as any, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return res.data
    }

    const res = await client.post(`/inspections`, { code, ...payload })
    return res.data
  } catch (err: any) {
    throw err
  }
}

export async function login(username: string, password: string) {
  try {
    const res = await client.post('/auth/login', { username, password })
    const data = res.data
    // accept multiple shapes
    const auth = {
      token: data.access_token ?? data.token ?? data.accessToken ?? data.auth?.token,
      refreshToken: data.refresh_token ?? data.refreshToken ?? data.auth?.refreshToken,
      expiresAt: data.expiresAt ?? (data.expires_in ? Date.now() + (data.expires_in * 1000) : undefined)
    }
    if (auth.token) {
      await Storage.saveAuth(auth as any)
      return auth
    }
    throw new Error('Login failed')
  } catch (err: any) {
    // if login fails, rethrow
    throw err
  }
}

export async function register(
  username: string,
  password: string,
  email: string,
  phone: string,
  role: string = 'inspector',
) {
  try {
    const res = await client.post('/auth/register', { username, password, email, phone, role })
    const data = res.data
    const auth = {
      token: data.access_token ?? data.token ?? data.accessToken ?? data.auth?.token,
      refreshToken: data.refresh_token ?? data.refreshToken ?? data.auth?.refreshToken,
      expiresAt: data.expiresAt ?? (data.expires_in ? Date.now() + (data.expires_in * 1000) : undefined)
    }
    if (auth.token) {
      await Storage.saveAuth(auth as any)
      return auth
    }
    throw new Error('Registration failed')
  } catch (err: any) {
    throw err
  }
}

