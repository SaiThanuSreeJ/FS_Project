import React, { createContext, useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { loginUser, registerUser, getMe } from '../services/api'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('vesto_token'))
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('vesto_token')
      if (storedToken) {
        try {
          const res = await getMe()
          if (res.data?.success && res.data?.data) {
            setUser(res.data.data)
          } else {
            // In case token is invalid
            localStorage.removeItem('vesto_token')
            localStorage.removeItem('vesto_user')
            setUser(null)
            setToken(null)
          }
        } catch (err) {
          localStorage.removeItem('vesto_token')
          localStorage.removeItem('vesto_user')
          setUser(null)
          setToken(null)
        }
      }
      setLoading(false)
    }

    initAuth()
  }, [])

  const login = async (credentials) => {
    const res = await loginUser(credentials)
    if (res.data?.success) {
      const { token: receivedToken, user: receivedUser } = res.data
      localStorage.setItem('vesto_token', receivedToken)
      if (receivedUser) {
        localStorage.setItem('vesto_user', JSON.stringify(receivedUser))
        setUser(receivedUser)
      }
      setToken(receivedToken)
      navigate('/dashboard')
      return res.data
    }
    throw new Error(res.data?.message || 'Failed to login')
  }

  const register = async (credentials) => {
    const res = await registerUser(credentials)
    if (res.data?.success) {
      const { token: receivedToken, user: receivedUser } = res.data
      localStorage.setItem('vesto_token', receivedToken)
      if (receivedUser) {
        localStorage.setItem('vesto_user', JSON.stringify(receivedUser))
        setUser(receivedUser)
      }
      setToken(receivedToken)
      navigate('/dashboard')
      return res.data
    }
    throw new Error(res.data?.message || 'Failed to register')
  }

  const logout = () => {
    localStorage.removeItem('vesto_token')
    localStorage.removeItem('vesto_user')
    setToken(null)
    setUser(null)
    navigate('/login')
  }

  const updateUser = (updatedUser) => {
    setUser(updatedUser)
    localStorage.setItem('vesto_user', JSON.stringify(updatedUser))
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        updateUser,
        isAuthenticated: !!token && !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext
