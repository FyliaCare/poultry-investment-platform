import { useState } from 'react'
import api from '../api/client'
import { useAuth } from '../store/auth'
import { useNavigate } from 'react-router-dom'

export default function Register() {
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const { setToken } = useAuth()
  const navigate = useNavigate()

  async function onSubmit(e:any) {
    e.preventDefault()
    setError(null)
    try {
  await api.post('/api/v1/auth/register', { email, password, full_name: fullName })
      // Auto login
      const form = new URLSearchParams()
      form.append('username', email)
      form.append('password', password)
  const res = await api.post('/api/v1/auth/login', form, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } })
      setToken(res.data.access_token)
      navigate('/portfolio')
    } catch (e:any) {
      let msg = 'Registration failed'
      if (e?.response) {
        msg = `Error ${e.response.status}: ${e.response.data?.detail || JSON.stringify(e.response.data)}`
      }
      setError(msg)
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-14">
      <h1 className="text-3xl font-extrabold">Create your account</h1>
      <form onSubmit={onSubmit} className="card p-6 mt-6 space-y-4">
        {error && <div className="text-sm text-red-600">{error}</div>}
        <input className="border rounded-lg px-3 py-2 w-full" placeholder="Full Name" value={fullName} onChange={e=>setFullName(e.target.value)} />
        <input className="border rounded-lg px-3 py-2 w-full" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input type="password" className="border rounded-lg px-3 py-2 w-full" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} />
        <button className="btn btn-primary w-full">Create account</button>
      </form>
    </div>
  )
}
