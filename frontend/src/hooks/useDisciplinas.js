import { useState, useCallback } from 'react'
import { useApi } from './useApi'

export const useDisciplinas = () => {
  const [disciplinas, setDisciplinas] = useState([])
  const [areas, setAreas] = useState([])
  const [contratistas, setContratistas] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { get, post, put, patch } = useApi()

  const cargarDisciplinas = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await get('/api/disciplinas')
      if (Array.isArray(data)) {
        setDisciplinas(data)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [get])

  const cargarAreas = useCallback(async () => {
    try {
      const data = await get('/api/areas')
      if (Array.isArray(data)) setAreas(data)
    } catch (err) {
      console.error('Error al cargar áreas:', err)
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

  const crearDisciplina = useCallback(async (disciplina) => {
    const data = await post('/api/disciplinas', {
      nombre: disciplina.nombre,
      area_id: Number(disciplina.area_id)
    })
    return data
  }, [post])

  const actualizarDisciplina = useCallback(async (id, disciplina) => {
    const data = await put(`/api/disciplinas/${id}`, {
      nombre: disciplina.nombre,
      area_id: Number(disciplina.area_id)
    })
    return data
  }, [put])

  const cambiarEstado = useCallback(async (id, nuevoEstado) => {
    const data = await patch(`/api/disciplinas/${id}/estado`, { estado_activo: nuevoEstado })
    return data
  }, [patch])

  return {
    disciplinas,
    areas,
    contratistas,
    loading,
    error,
    cargarDisciplinas,
    cargarAreas,
    cargarContratistas,
    crearDisciplina,
    actualizarDisciplina,
    cambiarEstado
  }
}