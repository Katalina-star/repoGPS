import { useState, useEffect, useCallback } from 'react'
import { useExpedientes } from '../../hooks/useExpedientes'
import { useProcesos } from '../../hooks/useProcesos'
import { useDisciplinas } from '../../hooks/useDisciplinas'
import { useApi } from '../../hooks/useApi'
import { useAuth } from '../../context/useAuth'
import { useContratistas } from '../../hooks/useContratistas'

const ExpedientesPanel = () => {
  const { user } = useAuth()
  const { get } = useApi()
  const { expedientes, cargarExpedientes, crearExpediente, abrirDetalle } = useExpedientes()
  const { procesos, cargarProcesos } = useProcesos()
  const { cargarDisciplinas } = useDisciplinas()
  const { contratistas, cargarContratistas } = useContratistas()

  const [mostrarForm, setMostrarForm] = useState(false)
  const [formData, setFormData] = useState({
    contratista_id: '',
    area_id: '',
    proceso_id: '',
    disciplina_id: '',
    titulo: '',
    descripcion: ''
  })
  const [etapasProceso, setEtapasProceso] = useState([])
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [filtroProceso, setFiltroProceso] = useState('')
  const [busqueda] = useState('')

  // Listas filtradas para selects en cascada
  const [areasFiltradas, setAreasFiltradas] = useState([])
  const [disciplinasFiltradas, setDisciplinasFiltradas] = useState([])
  const [procesosFiltrados, setProcesosFiltrados] = useState([])

  // Es admin?
  const esAdmin = user?.rol_id === 1

  // Cargar opciones iniciales
  useEffect(() => {
    Promise.all([cargarExpedientes(), cargarProcesos(), cargarDisciplinas(), cargarContratistas()])
  }, [cargarExpedientes, cargarProcesos, cargarDisciplinas, cargarContratistas])

  // Cargar áreas cuando se selecciona un contratista
  const cargarAreasPorContratista = useCallback(async (contratistaId) => {
    if (!contratistaId) {
      setAreasFiltradas([])
      setFormData(prev => ({ ...prev, area_id: '', disciplina_id: '', proceso_id: '' }))
      setDisciplinasFiltradas([])
      return
    }
    try {
      const data = await get(`/api/areas/contratista/${contratistaId}`)
      if (Array.isArray(data)) {
        setAreasFiltradas(data)
      }
    } catch (err) {
      console.error('Error al cargar áreas:', err)
      setAreasFiltradas([])
    }
  }, [get])

  // Cargar disciplinas cuando se selecciona un área
  const cargarDisciplinasPorArea = useCallback(async (areaId) => {
    if (!areaId) {
      setDisciplinasFiltradas([])
      setProcesosFiltrados([])
      setFormData(prev => ({ ...prev, disciplina_id: '', proceso_id: '' }))
      return
    }
    try {
      // Cargar disciplinas del área
      const dataDisc = await get(`/api/disciplinas/area/${areaId}`)
      if (Array.isArray(dataDisc)) {
        setDisciplinasFiltradas(dataDisc)
      }
      // Cargar procesos del área
      const dataProc = await get(`/api/procesos/area/${areaId}`)
      if (Array.isArray(dataProc)) {
        setProcesosFiltrados(dataProc)
      }
    } catch (err) {
      console.error('Error al cargar disciplinas/procesos:', err)
      setDisciplinasFiltradas([])
      setProcesosFiltrados([])
    }
  }, [get])

  // Cargar etapas cuando se selecciona un proceso
  const cargarEtapasProceso = useCallback(async (procesoId) => {
    if (!procesoId) {
      setEtapasProceso([])
      return
    }
    try {
      const data = await get(`/api/etapas-proceso/proceso/${procesoId}`)
      if (Array.isArray(data)) {
        setEtapasProceso(data)
      }
    } catch (err) {
      console.error('Error al cargar etapas:', err)
    }
  }, [get])

  // Handlers para cambios en selects
  const handleContratistaChange = async (e) => {
    const contratistaId = e.target.value
    setFormData(prev => ({ ...prev, contratista_id: contratistaId, area_id: '', disciplina_id: '', proceso_id: '' }))
    setAreasFiltradas([])
    setDisciplinasFiltradas([])
    setProcesosFiltrados([])
    setEtapasProceso([])
    if (contratistaId) {
      await cargarAreasPorContratista(contratistaId)
    }
  }

  const handleAreaChange = async (e) => {
    const areaId = e.target.value
    setFormData(prev => ({ ...prev, area_id: areaId, disciplina_id: '', proceso_id: '' }))
    setDisciplinasFiltradas([])
    setProcesosFiltrados([])
    setEtapasProceso([])
    if (areaId) {
      await cargarDisciplinasPorArea(areaId)
    }
  }

  const handleDisciplinaChange = (e) => {
    setFormData(prev => ({ ...prev, disciplina_id: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await crearExpediente(formData)
      setMostrarForm(false)
      setFormData({ contratista_id: '', area_id: '', proceso_id: '', disciplina_id: '', titulo: '', descripcion: '' })
      setAreasFiltradas([])
      setDisciplinasFiltradas([])
      setEtapasProceso([])
      cargarExpedientes()
    } catch (err) {
      alert(err.message)
    }
  }

  const filtrarData = () => {
    // Filtrar por área si no es admin
    let filtered = esAdmin
      ? expedientes
      : expedientes.filter(e => e.area_id === user?.area_id)

    return filtered
      .filter(e => {
        if (filtroEstado === 'en_proceso') {
          return !e.etapa_actual?.toLowerCase().includes('aprobad')
        }
        if (filtroEstado === 'completados') {
          return e.etapa_actual?.toLowerCase().includes('aprobad')
        }
        return true
      })
      .filter(e => !filtroProceso || e.proceso_id === Number(filtroProceso))
      .filter(e => {
        const s = busqueda.toLowerCase()
        return e.titulo?.toLowerCase().includes(s) || e.proceso_nombre?.toLowerCase().includes(s)
      })
  }

  return (
    <>
      {esAdmin && (
        <section className="panel">
          <div className="panel-top">
            <h3>Registrar Expediente</h3>
            <button className="btn btn-primary" onClick={() => setMostrarForm(!mostrarForm)}>
              {mostrarForm ? 'Cancelar' : '+ Nuevo Expediente'}
            </button>
          </div>

          {mostrarForm && (
            <form onSubmit={handleSubmit} className="form-grid">
              <div className="field">
                <label>Contratista</label>
                <select value={formData.contratista_id} onChange={handleContratistaChange} required>
                  <option value="">Seleccione...</option>
                  {contratistas.filter(c => c.estado_activo).map(c => (
                    <option key={c.id} value={c.id}>{c.razon_social}</option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label>Área</label>
                <select
                  value={formData.area_id}
                  onChange={handleAreaChange}
                  required
                  disabled={!formData.contratista_id}
                >
                  <option value="">Seleccione...</option>
                  {areasFiltradas.map(a => (
                    <option key={a.id} value={a.id}>{a.nombre}</option>
                  ))}
                </select>
              </div>

<div className="field">
                  <label>Disciplina</label>
                  <select
                    value={formData.disciplina_id}
                    onChange={handleDisciplinaChange}
                    required
                    disabled={!formData.area_id}
                  >
                    <option value="">Seleccione...</option>
                    {disciplinasFiltradas.map(d => (
                      <option key={d.id} value={d.id}>{d.nombre}</option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label>Proceso</label>
                  <select value={formData.proceso_id} onChange={async e => {
                    const procesoId = e.target.value
                    setFormData(prev => ({ ...prev, proceso_id: procesoId }))
                    if (procesoId) {
                      await cargarEtapasProceso(procesoId)
                    } else {
                      setEtapasProceso([])
                    }
                  }} required disabled={!formData.area_id}>
                    <option value="">Seleccione...</option>
                    {procesosFiltrados.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                  </select>
                </div>

                <div className="field">
                <label>Título</label>
                <input type="text" value={formData.titulo} onChange={e => setFormData({ ...formData, titulo: e.target.value })} required />
              </div>

              <div className="field">
                <label>Descripción</label>
                <textarea value={formData.descripcion} onChange={e => setFormData({ ...formData, descripcion: e.target.value })} />
              </div>

              {formData.proceso_id && etapasProceso.length > 0 && (
                <div className="field">
                  <label>Etapa Inicial (se asigna automáticamente)</label>
                  <input type="text" value={etapasProceso[0]?.nombre || ''} disabled />
                </div>
              )}
            </form>
          )}

          {mostrarForm && (
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">Crear Expediente</button>
            </div>
          )}
        </section>
      )}

      <section className="panel">
        <div className="panel-top table-top">
          <h3>Expedientes</h3>
          <div className="filter-group">
            <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}>
              <option value="todos">Todos</option>
              <option value="en_proceso">En Proceso</option>
              <option value="completados">Completados</option>
            </select>
            <select value={filtroProceso} onChange={e => setFiltroProceso(e.target.value)}>
              <option value="">Todos los Procesos</option>
              {procesos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </div>
        </div>
        <div className="table-wrap">
          <table className="users-table">
            <thead>
              <tr>
                <th>Título</th>
                <th>Proceso</th>
                <th>Etapa Actual</th>
                <th>Fecha Creación</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtrarData().map(exp => (
                <tr key={exp.id}>
                  <td>{exp.titulo}</td>
                  <td>{exp.proceso_nombre || '-'}</td>
                  <td><span className="role-tag">{exp.etapa_actual || 'Sin asignar'}</span></td>
                  <td>{new Date(exp.fecha_creacion).toLocaleDateString()}</td>
                  <td>
                    <button className="btn-mini btn-edit" onClick={() => abrirDetalle(exp)}>Ver Detalle</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}

export default ExpedientesPanel