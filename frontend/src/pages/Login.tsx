import { useState } from 'react'
import api from '../api/client'
import { useAuth } from '../store/auth'
import { useNavigate, Link } from 'react-router-dom'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const { setToken, fetchMe } = useAuth()
  const navigate = useNavigate()

  async function onSubmit(e: any) {
    e.preventDefault()
    setError(null)
    try {
      const form = new URLSearchParams()
      form.append('username', email)
      form.append('password', password)
  const res = await api.post('/api/v1/auth/login', form, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } })
      setToken(res.data.access_token)
      await fetchMe()
      navigate('/portfolio')
    } catch (e:any) {
      setError(e?.response?.data?.detail || 'Login failed')
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-14">
      <h1 className="text-3xl font-extrabold">Welcome back</h1>
      <form onSubmit={onSubmit} className="card p-6 mt-6 space-y-4">
        {error && <div className="text-sm text-red-600">{error}</div>}
        <input className="border rounded-lg px-3 py-2 w-full" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input type="password" className="border rounded-lg px-3 py-2 w-full" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} />
        <button className="btn btn-primary w-full">Log in</button>
        <div className="text-sm text-slate-600">No account? <Link to="/register" className="text-brand-700 underline">Create one</Link></div>
      </form>
    </div>
  )
}
