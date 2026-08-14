import React, { createContext, useContext, useState, useEffect } from 'react'
import api from '../lib/api'

interface UserInfo {
  id: string
  username: string
  name: string
  email: string
  role: 'ADMIN' | 'OPERATOR'
}

interface AuthContextType {
  user: UserInfo | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserInfo | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check localStorage on mount
    const storedToken = localStorage.getItem('sw360_token')
    const storedUser = localStorage.getItem('sw360_user')

    if (storedToken && storedUser) {
      const parsedUser = JSON.parse(storedUser)
      setToken(storedToken)
      setUser(parsedUser)
      api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`
    }
    setIsLoading(false)
  }, [])

  const login = async (username: string, password: string) => {
    setIsLoading(true)
    try {
      const res = await api.post('/auth/login', { username, password })
      const { token: receivedToken, user: receivedUser } = res.data
      
      setToken(receivedToken)
      setUser(receivedUser)
      
      localStorage.setItem('sw360_token', receivedToken)
      localStorage.setItem('sw360_user', JSON.stringify(receivedUser))
      
      api.defaults.headers.common['Authorization'] = `Bearer ${receivedToken}`
    } catch (err: any) {
      throw new Error(err.message || 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    // Fire logout request to backend (non-blocking)
    if (token) {
      api.post('/auth/logout').catch(() => {})
    }
    
    setToken(null)
    setUser(null)
    localStorage.removeItem('sw360_token')
    localStorage.removeItem('sw360_user')
    delete api.defaults.headers.common['Authorization']
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
