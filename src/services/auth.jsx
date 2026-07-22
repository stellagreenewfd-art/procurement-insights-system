import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import {
  registerUser,
  loginUser,
  loginAdmin,
  getCurrentUser,
  logout as doLogout,
  recordSearch,
} from './storage'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const current = getCurrentUser()
    setUser(current)
    setLoading(false)
  }, [])

  const register = useCallback(async ({ phone, username, password, company, industry }) => {
    const result = await registerUser({ phone, username, password, company, industry })
    if (result.ok) {
      setUser(result.user)
    }
    return result
  }, [])

  const login = useCallback(async (phone, password) => {
    const result = await loginUser(phone, password)
    if (result.ok) setUser(result.user)
    return result
  }, [])

  const adminLogin = useCallback((username, password) => {
    const result = loginAdmin(username, password)
    if (result.ok) setUser(result.user)
    return result
  }, [])

  const logout = useCallback(() => {
    doLogout()
    setUser(null)
  }, [])

  const trackSearch = useCallback((category, resultSummary) => {
    if (user) {
      recordSearch(user.id, user.phone || '', category, resultSummary)
    }
  }, [user])

  const value = {
    user, loading, isAdmin: user?.role === 'admin', isAuthenticated: !!user,
    register, login, adminLogin, logout, trackSearch,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
