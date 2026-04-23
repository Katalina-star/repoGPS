import { useCallback } from 'react'
import { useAuth } from '../context/useAuth'

const API_URL = import.meta.env.VITE_API_URL || ''

const getAuthHeaders = () => {
  const token = localStorage.getItem('token')
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  }
}

const handleResponse = async (res, logout, data) => {
  if (res.status === 401) {
    logout()
    throw new Error('Sesión expirada')
  }
  if (!res.ok) {
    throw new Error(data.error || 'Error en la petición')
  }
  return data
}

// === useApi Base ===
export const useApi = () => {
  const { logout } = useAuth()

  const get = useCallback(async (endpoint) => {
    const res = await fetch(`${API_URL}${endpoint}`, { headers: getAuthHeaders() })
    const data = await res.json()
    return handleResponse(res, logout, data)
  }, [logout])

  const post = useCallback(async (endpoint, body) => {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(body)
    })
    const data = await res.json()
    return handleResponse(res, logout, data)
  }, [logout])

  const put = useCallback(async (endpoint, body) => {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(body)
    })
    const data = await res.json()
    return handleResponse(res, logout, data)
  }, [logout])

  const patch = useCallback(async (endpoint, body) => {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(body)
    })
    const data = await res.json()
    return handleResponse(res, logout, data)
  }, [logout])

  return { get, post, put, patch }
}