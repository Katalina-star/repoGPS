import { useState, useCallback } from 'react'
import { useApi } from './useApi'

export const useTareas = () => {
  const { get, patch } = useApi()
  const [tareas, setTareas] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Cargar tareas del usuario por area y rol
  const cargarTareas = useCallback(async (usuarioId, areaId, rolId) => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ usuario_id: usuarioId })
      if (areaId) params.append('area_id', areaId)
      if (rolId) params.append('rol_id', rolId)
      
      const data = await get(`/api/tareas/mis-tareas?${params}`)
      setTareas(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message)
      setTareas([])
    } finally {
      setLoading(false)
    }
  }, [get])

  // Marcar tarea como vista
  const marcarVisto = useCallback(async (tareaId) => {
    try {
      const data = await patch(`/api/tareas/${tareaId}/visto`)
      setTareas(prev => prev.map(t => t.id === tareaId ? { ...t, estado: 'visto' } : t))
      return data
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [patch])

  // Completar o rechazar tarea
  const actualizarTarea = useCallback(async (tareaId, estado, observacion = null) => {
    try {
      const data = await patch(`/api/tareas/${tareaId}`, { estado, observacion })
      // Remover tarea completada/rechazada de la lista
      setTareas(prev => prev.filter(t => t.id !== tareaId))
      return data
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [patch])

  return {
    tareas,
    loading,
    error,
    cargarTareas,
    marcarVisto,
    actualizarTarea
  }
}