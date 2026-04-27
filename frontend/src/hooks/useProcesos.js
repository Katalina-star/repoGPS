import { useState, useCallback } from 'react'
import { useApi } from './useApi'

export const useProcesos = () => {
  const [procesos, setProcesos] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { get, post, put, patch } = useApi()

  const cargarProcesos = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await get('/api/procesos')
      if (Array.isArray(data)) {
        setProcesos(data)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [get])

  const crearProceso = useCallback(async (proceso) => {
    const data = await post('/api/procesos', {
      area_id: Number(proceso.area_id),
      nombre: proceso.nombre,
      descripcion: proceso.descripcion
    })
    return data
  }, [post])

  const actualizarProceso = useCallback(async (id, proceso) => {
    const data = await put(`/api/procesos/${id}`, {
      area_id: Number(proceso.area_id),
      nombre: proceso.nombre,
      descripcion: proceso.descripcion
    })
    return data
  }, [put])

  const cambiarEstado = useCallback(async (id, nuevoEstado) => {
    const data = await patch(`/api/procesos/${id}/estado`, { estado_activo: nuevoEstado })
    return data
  }, [patch])

  return {
    procesos,
    loading,
    error,
    cargarProcesos,
    crearProceso,
    actualizarProceso,
    cambiarEstado
  }
}