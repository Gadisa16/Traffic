import { useRouter } from 'next/router'
import { useState } from 'react'
import Layout from '../components/Layout'
import { useToast } from '../components/Toast'
import api from '../lib/api'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter()
  const { push } = useToast()

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    try {
      await api.login(username, password)
      push('Signed in', 'success')
      router.push('/vehicles')
    } catch (err: unknown) {
      if (typeof err === 'string') push(err, 'error')
      else if (typeof err === 'object' && err && 'message' in err) {
        const m = (err as { message?: unknown }).message
        push(typeof m === 'string' ? m : String(m), 'error')
      } else {
        push('Login failed', 'error')
      }
    }
  }

  return (
    <Layout>
      <div className="p-6 max-w-md mx-auto">
        <h1 className="text-2xl font-semibold mb-4">Sign in</h1>
        <form onSubmit={submit} className="space-y-4">
          <input className="w-full p-2 border rounded" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} />
          <input type="password" className="w-full p-2 border rounded" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
          <button className="px-4 py-2 bg-blue-600 text-white rounded">Sign in</button>
        </form>
      </div>
    </Layout>
  )
}
