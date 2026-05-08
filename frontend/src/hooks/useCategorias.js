import { useState, useCallback } from 'react'
import { useApi } from './useApi'

export const useCategorias = () => {
  const [categorias, setCategorias] = useState([])
  const [subtipos, setSubtipos] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { get, post, put, patch } = useApi()

  const cargarCategorias = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await get('/api/categorias')
      if (Array.isArray(data)) {
        setCategorias(data)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [get])

  const cargarSubtipos = useCallback(async (categoriaId = null) => {
    setLoading(true)
    setError(null)
    try {
      let data
      if (categoriaId) {
        data = await get(`/api/subtipos/categoria/${categoriaId}`)
      } else {
        data = await get('/api/subtipos')
      }
      if (Array.isArray(data)) {
        setSubtipos(data)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [get])

  const crearCategoria = useCallback(async (categoria) => {
    const data = await post('/api/categorias', {
      nombre: categoria.nombre,
      descripcion: categoria.descripcion || null
    })
    return data
  }, [post])

  const actualizarCategoria = useCallback(async (id, categoria) => {
    const data = await put(`/api/categorias/${id}`, {
      nombre: categoria.nombre,
      descripcion: categoria.descripcion || null
    })
    return data
  }, [put])

  const cambiarEstadoCategoria = useCallback(async (id, nuevoEstado) => {
    const data = await patch(`/api/categorias/${id}/estado`, { estado_activo: nuevoEstado })
    return data
  }, [patch])

  const crearSubtipo = useCallback(async (subtipo) => {
    const data = await post('/api/subtipos', {
      categoria_id: Number(subtipo.categoria_id),
      nombre: subtipo.nombre,
      descripcion: subtipo.descripcion || null
    })
    return data
  }, [post])

  const actualizarSubtipo = useCallback(async (id, subtipo) => {
    const data = await put(`/api/subtipos/${id}`, {
      categoria_id: Number(subtipo.categoria_id),
      nombre: subtipo.nombre,
      descripcion: subtipo.descripcion || null
    })
    return data
  }, [put])

  const cambiarEstadoSubtipo = useCallback(async (id, nuevoEstado) => {
    const data = await patch(`/api/subtipos/${id}/estado`, { estado_activo: nuevoEstado })
    return data
  }, [patch])

  return {
    categorias,
    subtipos,
    loading,
    error,
    cargarCategorias,
    cargarSubtipos,
    crearCategoria,
    actualizarCategoria,
    cambiarEstadoCategoria,
    crearSubtipo,
    actualizarSubtipo,
    cambiarEstadoSubtipo
  }
}