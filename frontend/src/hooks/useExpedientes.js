import { useState, useCallback } from 'react'
import { useApi } from './useApi'

export const useExpedientes = () => {
  const [expedientes, setExpedientes] = useState([])
  const [expedienteDetalle, setExpedienteDetalle] = useState(null)
  const [historial, setHistorial] = useState([])
  const [documentos, setDocumentos] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { get, post, put, patch } = useApi()

  const cargarExpedientes = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await get('/api/expedientes')
      if (Array.isArray(data)) {
        setExpedientes(data)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [get])

  const crearExpediente = useCallback(async (expediente) => {
    const data = await post('/api/expedientes', {
      proceso_id: Number(expediente.proceso_id),
      disciplina_id: Number(expediente.disciplina_id),
      titulo: expediente.titulo,
      descripcion: expediente.descripcion
    })
    return data
  }, [post])

  const abrirDetalle = useCallback(async (exp) => {
    setExpedienteDetalle(exp)
    try {
      const [histData, docData] = await Promise.all([
        get(`/api/historial/expediente/${exp.id}`),
        get(`/api/documentos/expediente/${exp.id}`)
      ])
      setHistorial(Array.isArray(histData) ? histData : [])
      setDocumentos(Array.isArray(docData) ? docData : [])
    } catch (err) {
      console.error('Error al cargar detalle:', err)
    }
  }, [get])

  const cerrarDetalle = useCallback(() => {
    setExpedienteDetalle(null)
    setHistorial([])
    setDocumentos([])
  }, [])

  const avanzarExpediente = useCallback(async (id, observacion) => {
    const data = await post(`/api/expedientes/${id}/avanzar`, { observacion })
    if (data) {
      await cargarExpedientes()
    }
    return data
  }, [post, cargarExpedientes])

  const devolverExpediente = useCallback(async (id, observacion) => {
    const data = await post(`/api/expedientes/${id}/devolver`, { observacion })
    if (data) {
      await cargarExpedientes()
    }
    return data
  }, [post, cargarExpedientes])

  return {
    expedientes,
    expedienteDetalle,
    historial,
    documentos,
    loading,
    error,
    cargarExpedientes,
    crearExpediente,
    abrirDetalle,
    cerrarDetalle,
    avanzarExpediente,
    devolverExpediente
  }
}