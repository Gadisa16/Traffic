import axios from 'axios'
import * as Storage from './storage'

// Default backend host; override for local device testing
const BACKEND_HOST = 'http://102.218.50.25:8000'
const client = axios.create({ baseURL: BACKEND_HOST, timeout: 10000 })

// simple session expired callback (set by app)
let onSessionExpired: (() => void) | null = null
export function setOnSessionExpired(fn: (() => void) | null) { onSessionExpired = fn }

// low-level client without interceptors for token refresh calls
const raw = axios.create({ baseURL: client.defaults.baseURL, timeout: 10000 })

async function refreshAuth(): Promise<boolean> {
  try {
    const auth = await Storage.getAuth()
    if (!auth?.refreshToken) return false
    const res = await raw.post('/auth/refresh', { refreshToken: auth.refreshToken })
    const data = res.data
    const newAuth = {
      token: data.access_token ?? data.token ?? data.accessToken ?? auth.token,
      refreshToken: data.refresh_token ?? data.refreshToken ?? auth.refreshToken,
      expiresAt: data.expiresAt ?? (data.expires_in ? Date.now() + (data.expires_in * 1000) : undefined)
    }
    if (newAuth.token) {
      await Storage.saveAuth(newAuth as any)
      return true
    }
    return false
  } catch (e) {
    try { await Storage.clearToken() } catch (e) {}
    return false
  }
}

// attach authorization header from storage; proactively refresh if close to expiry
client.interceptors.request.use(async (cfg) => {
  try {
    const auth = await Storage.getAuth()
    if (auth?.expiresAt) {
      const now = Date.now()
      const threshold = 30 * 1000 // 30s before expiry
      if (auth.expiresAt - now < threshold) {
        const ok = await refreshAuth()
        if (!ok) {
          if (onSessionExpired) onSessionExpired()
          throw new axios.Cancel('session_expired')
        }
      }
    }
    const token = (await Storage.getAuth())?.token
    if (token) {
      cfg.headers = cfg.headers || {}
      ;(cfg.headers as any).Authorization = `Bearer ${token}`
    }
  } catch (e) {
    // if session expired triggered a cancel, propagate
    throw e
  }
  return cfg
})

let refreshing: Promise<any> | null = null
// response interceptor to refresh token on 401
client.interceptors.response.use(undefined, async (err) => {
  const original = err.config
  if (!original) return Promise.reject(err)
  if (err.response && err.response.status === 401 && !original._retry) {
    original._retry = true
    try {
      const auth = await Storage.getAuth()
      if (auth?.refreshToken) {
        if (!refreshing) {
          refreshing = raw.post('/auth/refresh', { refreshToken: auth.refreshToken }).then(r => r.data).finally(() => { refreshing = null })
        }
        const newAuth = await refreshing
        if (newAuth) {
          const merged = {
            token: newAuth.access_token ?? newAuth.token ?? newAuth.token,
            refreshToken: newAuth.refresh_token ?? newAuth.refreshToken ?? auth.refreshToken,
            expiresAt: newAuth.expiresAt ?? (Date.now() + ((newAuth.expires_in || 3600) * 1000))
          }
          await Storage.saveAuth(merged)
          // set header and retry
          original.headers = original.headers || {}
          original.headers['Authorization'] = `Bearer ${merged.token}`
          return client(original)
        }
      }
    } catch (e) {
      try { await Storage.clearToken() } catch (e) {}
      if (onSessionExpired) onSessionExpired()
      return Promise.reject(err)
    }
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
    // fallback to stub
    await Storage.saveAuth({ token: 'mock-token', expiresAt: Date.now() + 1000 * 60 * 60 })
    return { token: 'mock-token', expiresAt: Date.now() + 1000 * 60 * 60 }
  } catch (err: any) {
    // if login fails, rethrow
    throw err
  }
}

