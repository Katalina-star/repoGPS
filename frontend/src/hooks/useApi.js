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
  if (res.status === 403) {
    throw new Error(data.error || 'No tienes permisos para esta acción')
  }
  if (!res.ok) {
    // Prefer structured error from body when available
    throw new Error((data && data.error) || `Error en la petición (status: ${res.status})`)
  }
  return data
}

// === useApi Base ===
export const useApi = () => {
  const { logout } = useAuth()

  const parseResponseSafely = async (res) => {
    const text = await res.text()
    const contentType = res.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      try {
        return JSON.parse(text)
      } catch (e) {
        // invalid JSON - keep diagnostic in logs for debugging
        console.error('Invalid JSON response from API', e)
        throw new Error(`Invalid JSON response from API: ${text.slice(0, 200)}`)
      }
    }
    // Non-JSON response (likely HTML error page)
    throw new Error(`Non-JSON response from API: ${text.slice(0, 200)}`)
  }

  const get = useCallback(async (endpoint) => {
    const res = await fetch(`${API_URL}${endpoint}`, { headers: getAuthHeaders() })
    const data = await parseResponseSafely(res)
    return handleResponse(res, logout, data)
  }, [logout])

  const post = useCallback(async (endpoint, body) => {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(body)
    })
    const data = await parseResponseSafely(res)
    return handleResponse(res, logout, data)
  }, [logout])

  const put = useCallback(async (endpoint, body) => {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(body)
    })
    const data = await parseResponseSafely(res)
    return handleResponse(res, logout, data)
  }, [logout])

  const patch = useCallback(async (endpoint, body) => {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(body)
    })
    const data = await parseResponseSafely(res)
    return handleResponse(res, logout, data)
  }, [logout])

  return { get, post, put, patch }
}
