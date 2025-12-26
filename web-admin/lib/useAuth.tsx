import { useRouter } from 'next/router'
import { ReactNode, useEffect, useRef, useState } from 'react'
import Spinner from '../components/Spinner'
import { useToast } from '../components/Toast'
import { UserOut } from '../types'
import api, { refreshToken } from './api'

export function useAuth() {
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<UserOut | null>(null)
  const [loading, setLoading] = useState(false)
  const [expiresAt, setExpiresAt] = useState<number | null>(null)
  const [expiringSoon, setExpiringSoon] = useState(false)
  const retryTimer = useRef<number | null>(null)
  const maxAttempts = 3
  const baseDelay = 2000 // ms
  const { push } = useToast()

  useEffect(() => {
    if (typeof window === 'undefined') return
    const t = localStorage.getItem('access_token')
    setToken(t)
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'access_token') setToken(e.newValue)
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  // fetch user info when token changes
  useEffect(() => {
    let mounted = true
    let timer: number | null = null
    let expiringTimer: number | null = null

    async function fetchUser() {
      if (!token) {
        setUser(null)
        setExpiresAt(null)
        setExpiringSoon(false)
        return
      }
      setLoading(true)
      try {
        const u = await api.getCurrentUser()
        if (!mounted) return
        setUser(u)
        // schedule refresh based on token expiry
        try {
          const parts = token.split('.')
          if (parts.length === 3) {
            const payload = JSON.parse(decodeURIComponent(escape(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))))
            if (payload && payload.exp) {
              const _expiresAt = payload.exp * 1000
              setExpiresAt(_expiresAt)
              const refreshAt = _expiresAt - 60 * 1000 // refresh 60s before expiry
              const ms = Math.max(0, refreshAt - Date.now())
              if (timer) window.clearTimeout(timer)
              // attempt refresh with retries and exponential backoff
              const attemptRefresh = async (attempt = 1) => {
                try {
                  const tok = await refreshToken()
                  localStorage.setItem('access_token', tok.access_token)
                  setToken(tok.access_token)
                } catch {
                  if (attempt < maxAttempts) {
                    const delay = baseDelay * Math.pow(2, attempt - 1)
                    retryTimer.current = window.setTimeout(() => attemptRefresh(attempt + 1), delay) as unknown as number
                    return
                  }
                  // final failure: notify and force logout
                  try { push('Session expired, please sign in again', 'error') } catch { /* ignore */ }
                  localStorage.removeItem('access_token')
                  setToken(null)
                  setUser(null)
                  // redirect to login
                  window.location.href = '/login'
                }
              }

              timer = window.setTimeout(() => attemptRefresh(1), ms) as unknown as number
              // schedule expiringSoon flag threshold (2 minutes)
              const threshold = 2 * 60 * 1000
              if (expiringTimer) window.clearTimeout(expiringTimer)
              const timeUntilExpiring = _expiresAt - threshold - Date.now()
              if (timeUntilExpiring <= 0) setExpiringSoon(true)
              else expiringTimer = window.setTimeout(() => setExpiringSoon(true), timeUntilExpiring) as unknown as number
            }
          }
        } catch {
          // ignore parse errors
        }
      } catch {
        // token invalid or expired: clear it
        localStorage.removeItem('access_token')
        setToken(null)
        setUser(null)
        setExpiresAt(null)
        setExpiringSoon(false)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    fetchUser()
    return () => { mounted = false; if (timer) window.clearTimeout(timer); if (expiringTimer) window.clearTimeout(expiringTimer); if (retryTimer.current) window.clearTimeout(retryTimer.current) }
  }, [token, push])

  async function extendSession() {
    try {
      const tok = await refreshToken()
      localStorage.setItem('access_token', tok.access_token)
      setToken(tok.access_token)
      setExpiringSoon(false)
      return true
    } catch {
      return false
    }
  }

  return {
    token,
    user,
    isAuthenticated: !!token && !!user,
    loading,
    setToken,
    expiresAt,
    expiringSoon,
    extendSession,
  }
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!mounted) return
    if (!loading && !isAuthenticated) router.replace('/login')
  }, [isAuthenticated, mounted, loading, router])

  if (!mounted) return null
  if (loading || !isAuthenticated) return (
    <div className="p-6 max-w-2xl mx-auto flex items-center justify-center">
      <Spinner size={4} />
    </div>
  )

  return <>{children}</>
}

export default useAuth
