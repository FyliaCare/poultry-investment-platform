
import { create } from 'zustand'
import api from '../api/client'

export interface User {
  id: number
  email: string
  full_name?: string
  is_admin?: boolean
  roles?: string[]
  [key: string]: any
}

interface AuthState {
  token: string | null
  user: User | null
  isAuthed: boolean
  loading: boolean
  error: string | null
  setToken: (t: string | null) => void
  fetchMe: () => Promise<void>
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, full_name?: string) => Promise<void>
  updateProfile: (data: Partial<User>) => Promise<void>
  resetPassword: (email: string) => Promise<void>
  logout: () => void
}

export const useAuth = create<AuthState>((set, get) => ({
  token: localStorage.getItem('token'),
  user: null,
  isAuthed: !!localStorage.getItem('token'),
  loading: false,
  error: null,

  setToken: (t) => {
    if (t) localStorage.setItem('token', t)
    else localStorage.removeItem('token')
    set({ token: t, isAuthed: !!t })
  },

  fetchMe: async () => {
    set({ loading: true, error: null })
    try {
      const res = await api.get('/api/v1/auth/me')
      set({ user: res.data, loading: false })
    } catch (e: any) {
      set({ user: null, token: null, isAuthed: false, loading: false, error: e?.response?.data?.detail || 'Failed to fetch user.' })
      localStorage.removeItem('token')
    }
  },

  login: async (email, password) => {
    set({ loading: true, error: null })
    try {
      const form = new URLSearchParams()
      form.append('username', email)
      form.append('password', password)
      const res = await api.post('/api/v1/auth/login', form, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } })
      get().setToken(res.data.access_token)
      await get().fetchMe()
      set({ loading: false })
    } catch (e: any) {
      set({ error: e?.response?.data?.detail || 'Login failed', loading: false })
    }
  },

  register: async (email, password, full_name) => {
    set({ loading: true, error: null })
    try {
      const res = await api.post('/api/v1/auth/register', { email, password, full_name })
      set({ user: res.data, loading: false })
    } catch (e: any) {
      set({ error: e?.response?.data?.detail || 'Registration failed', loading: false })
    }
  },

  updateProfile: async (data) => {
    set({ loading: true, error: null })
    try {
      const res = await api.put('/api/v1/auth/me', data)
      set({ user: res.data, loading: false })
    } catch (e: any) {
      set({ error: e?.response?.data?.detail || 'Profile update failed', loading: false })
    }
  },

  resetPassword: async (email) => {
    set({ loading: true, error: null })
    try {
      await api.post('/api/v1/auth/reset-password', { email })
      set({ loading: false })
    } catch (e: any) {
      set({ error: e?.response?.data?.detail || 'Password reset failed', loading: false })
    }
  },

  logout: () => {
    localStorage.removeItem('token')
    set({ token: null, isAuthed: false, user: null, error: null })
  }
}))
