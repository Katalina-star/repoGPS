import { useState, useCallback } from 'react'
import { useApi } from './useApi'

export const useContratistas = () => {
  const [contratistas, setContratistas] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { get, post, put, patch } = useApi()

  const cargarContratistas = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await get('/api/contratistas')
      if (Array.isArray(data)) {
        setContratistas(data)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [get])

  const crearContratista = useCallback(async (contratista) => {
    const data = await post('/api/contratistas', contratista)
    return data
  }, [post])

  const actualizarContratista = useCallback(async (id, contratista) => {
    const data = await put(`/api/contratistas/${id}`, contratista)
    return data
  }, [put])

  const cambiarEstado = useCallback(async (id, nuevoEstado) => {
    const data = await patch(`/api/contratistas/${id}/estado`, { estado_activo: nuevoEstado })
    return data
  }, [patch])

  return {
    contratistas,
    loading,
    error,
    cargarContratistas,
    crearContratista,
    actualizarContratista,
    cambiarEstado
  }
}