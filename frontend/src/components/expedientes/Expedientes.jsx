import { useState, useEffect, useCallback } from 'react'
import { useExpedientes } from '../../hooks/useExpedientes'
import { useProcesos } from '../../hooks/useProcesos'
import { useDisciplinas } from '../../hooks/useDisciplinas'
import { useApi } from '../../hooks/useApi'

const ExpedientesPanel = () => {
  const { get } = useApi()
  const { expedientes, loading, cargarExpedientes, crearExpediente, abrirDetalle, cerrarDetalle } = useExpedientes()
  const { procesos, cargarProcesos } = useProcesos()
  const { disciplinas, cargarDisciplinas } = useDisciplinas()

  const [mostrarForm, setMostrarForm] = useState(false)
  const [formData, setFormData] = useState({ proceso_id: '', disciplina_id: '', titulo: '', descripcion: '' })
  const [etapasProceso, setEtapasProceso] = useState([])
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [filtroProceso, setFiltroProceso] = useState('')
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => {
    Promise.all([cargarExpedientes(), cargarProcesos(), cargarDisciplinas()])
  }, [cargarExpedientes, cargarProcesos, cargarDisciplinas])

  const cargarEtapasProceso = useCallback(async (procesoId) => {
    try {
      const data = await get(`/api/etapas-proceso/proceso/${procesoId}`)
      if (Array.isArray(data)) {
        setEtapasProceso(data)
      }
    } catch (err) {
      console.error('Error al cargar etapas:', err)
    }
  }, [get])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await crearExpediente(formData)
      setMostrarForm(false)
      setFormData({ proceso_id: '', disciplina_id: '', titulo: '', descripcion: '' })
      cargarExpedientes()
    } catch (err) {
      alert(err.message)
    }
  }

  const filtrarData = () => {
    return expedientes
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
              <label>Proceso</label>
              <select value={formData.proceso_id} onChange={async e => {
                const procesoId = e.target.value
                setFormData({ ...formData, proceso_id: procesoId })
                if (procesoId) {
                  await cargarEtapasProceso(procesoId)
                }
              }} required>
                <option value="">Seleccione...</option>
                {procesos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Disciplina</label>
              <select value={formData.disciplina_id} onChange={e => setFormData({ ...formData, disciplina_id: e.target.value })} required>
                <option value="">Seleccione...</option>
                {disciplinas.filter(d => d.estado_activo).map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
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