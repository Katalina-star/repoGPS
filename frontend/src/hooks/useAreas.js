import { useState, useCallback } from 'react'
import { useApi } from './useApi'

export const useAreas = () => {
  const [areas, setAreas] = useState([])
  const [contratistas, setContratistas] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { get, post, put, patch } = useApi()

  const cargarAreas = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await get('/api/areas')
      if (Array.isArray(data)) {
        setAreas(data)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [get])

  const cargarContratistas = useCallback(async () => {
    try {
      const data = await get('/api/contratistas')
      if (Array.isArray(data)) setContratistas(data)
    } catch (err) {
      console.error('Error al cargar contratistas:', err)
    }
  }, [get])

  const crearArea = useCallback(async (area) => {
    const data = await post('/api/areas', {
      nombre: area.nombre,
      contratista_id: Number(area.contratista_id)
    })
    return data
  }, [post])

  const actualizarArea = useCallback(async (id, area) => {
    const data = await put(`/api/areas/${id}`, {
      nombre: area.nombre,
      contratista_id: Number(area.contratista_id)
    })
    return data
  }, [put])

  const cambiarEstado = useCallback(async (id, nuevoEstado) => {
    const data = await patch(`/api/areas/${id}/estado`, { estado_activo: nuevoEstado })
    return data
  }, [patch])

  return {
    areas,
    contratistas,
    loading,
    error,
    cargarAreas,
    cargarContratistas,
    crearArea,
    actualizarArea,
    cambiarEstado
  }
}