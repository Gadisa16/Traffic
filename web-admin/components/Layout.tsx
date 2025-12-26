import Link from 'next/link'
import api from '../lib/api'
import useAuth from '../lib/useAuth'
import useNow from '../lib/useNow'
import { useTheme } from './ThemeProvider'
import { useToast } from './Toast'

export default function Layout({ children }: { children: React.ReactNode }) {
  const { theme, toggle } = useTheme()
  const { user, isAuthenticated, expiringSoon, expiresAt, extendSession } = useAuth()
    const now = useNow(60000)
  const { push } = useToast()

  function handleLogout() {
    api.logout()
    // force reload so useAuth hook notices removed token
    window.location.href = '/login'
  }

  async function handleExtend() {
    const ok = await extendSession()
    if (ok) push('Session extended', 'success')
    else push('Could not extend session', 'error')
  }

  return (
    <div className="min-h-screen">
      <header className="surface shadow">
        <div className="max-w-6xl mx-auto p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="font-bold">Taxi Admin — Hawassa</div>
            <div className="text-sm text-gray-500 dark:text-gray-400 hidden md:block">Sidama Regional Transport</div>
          </div>
          <div className="flex items-center gap-4">
            <nav className="space-x-4">
              <Link href="/" className="text-sm text-gray-700 dark:text-gray-200">Dashboard</Link>
              <Link href="/vehicles" className="text-sm text-gray-700 dark:text-gray-200">Vehicles</Link>
            </nav>
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <div className="text-sm text-gray-700 dark:text-gray-200">{user?.username}</div>
                <button onClick={handleLogout} className="px-2 py-1 border rounded text-sm">Logout</button>
                <button onClick={toggle} aria-label="Toggle theme" className="px-2 py-1 border rounded text-sm">{theme === 'dark' ? 'Light' : 'Dark'}</button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login" className="px-2 py-1 border rounded text-sm">Sign in</Link>
                <button onClick={toggle} aria-label="Toggle theme" className="px-2 py-1 border rounded text-sm">{theme === 'dark' ? 'Light' : 'Dark'}</button>
              </div>
            )}
          </div>
        </div>
      </header>
      {expiringSoon && isAuthenticated && (
        <div className="max-w-6xl mx-auto p-2 mt-2">
          <div className="rounded p-3 bg-yellow-50 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 flex items-center justify-between">
            <div>
              <strong>Session expiring soon</strong>
              {expiresAt && (
                 <span className="ml-2 text-sm muted">— expires in {Math.max(0, Math.ceil((expiresAt - now) / 60000))} min</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleExtend} className="btn btn-primary">Extend session</button>
              <button onClick={handleLogout} className="btn">Sign out</button>
            </div>
          </div>
        </div>
      )}
      <main className="max-w-6xl mx-auto p-6">{children}</main>
    </div>
  )
}
