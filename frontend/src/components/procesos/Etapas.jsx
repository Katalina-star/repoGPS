import { useState, useEffect } from 'react'
import { useEtapas } from '../../hooks/useEtapas'
import { useProcesos } from '../../hooks/useProcesos'
import { useUsuarios } from '../../hooks/useUsuarios'

const EtapasPanel = ({ busqueda = '' }) => {
  const { etapas, cargarEtapas, crearEtapa, actualizarEtapa, cambiarEstado } = useEtapas()
  const { procesos, cargarProcesos } = useProcesos()
  const { roles, cargarRoles } = useUsuarios()

  const [formData, setFormData] = useState({
    proceso_id: '',
    nombre: '',
    orden: '',
    es_final: false,
    tipo_tarea: '',
    rol_id: ''
  })
  const [editandoId, setEditandoId] = useState(null)
  const [tabActiva, setTabActiva] = useState('activos')

  useEffect(() => {
    Promise.all([cargarEtapas(), cargarProcesos(), cargarRoles()])
  }, [cargarEtapas, cargarProcesos, cargarRoles])

  const limpiarFormulario = () => {
    setFormData({
      proceso_id: '',
      nombre: '',
      orden: '',
      es_final: false,
      tipo_tarea: '',
      rol_id: ''
    })
    setEditandoId(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if ((formData.tipo_tarea && !formData.rol_id) || (!formData.tipo_tarea && formData.rol_id)) {
      alert('Tipo de tarea y rol responsable deben definirse juntos')
      return
    }
    try {
      if (editandoId) {
        await actualizarEtapa(editandoId, formData)
      } else {
        await crearEtapa(formData)
      }
      limpiarFormulario()
      cargarEtapas()
    } catch (err) {
      alert(err.message)
    }
  }

  const handleEditar = (e) => {
    setFormData({
      proceso_id: String(e.proceso_id),
      nombre: e.nombre,
      orden: String(e.orden),
      es_final: e.es_final,
      tipo_tarea: e.tipo_tarea || '',
      rol_id: String(e.rol_id || '')
    })
    setEditandoId(e.id)
  }

  const filtrarData = () => {
    return etapas
      .filter(et => tabActiva === 'activos' ? et.estado_activo : !et.estado_activo)
      .filter(et => {
        const s = busqueda.toLowerCase()
        return et.nombre?.toLowerCase().includes(s)
      })
  }

  const getTitulo = () => editandoId ? 'Modificar' : 'Registrar'

  return (
    <>
      <section className="panel">
        <div className="panel-top">
          <h3>{getTitulo()} Etapa</h3>
        </div>
        <form onSubmit={handleSubmit} className="form-grid" id="etapa-form">
          <div className="field">
            <label>Proceso</label>
            <select value={formData.proceso_id} onChange={e => setFormData({ ...formData, proceso_id: e.target.value })} required>
              <option value="">Seleccione...</option>
              {procesos.filter(p => p.estado_activo).map(p => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Nombre de la Etapa</label>
            <input type="text" value={formData.nombre} onChange={e => setFormData({ ...formData, nombre: e.target.value })} required />
          </div>
          <div className="field">
            <label>Orden (secuencia)</label>
            <input type="number" min="1" value={formData.orden} onChange={e => setFormData({ ...formData, orden: e.target.value })} required />
          </div>
          <div className="field">
            <label>Tipo de tarea</label>
            <select value={formData.tipo_tarea} onChange={e => setFormData({ ...formData, tipo_tarea: e.target.value })}>
              <option value="">Sin tarea</option>
              <option value="revision">Revisión</option>
              <option value="aprobacion">Aprobación</option>
              <option value="visacion">Visación</option>
            </select>
          </div>
          <div className="field">
            <label>Rol responsable</label>
            <select
              value={formData.rol_id}
              onChange={e => setFormData({ ...formData, rol_id: e.target.value })}
              disabled={!formData.tipo_tarea}
            >
              <option value="">Sin asignar</option>
              {roles.map(r => (
                <option key={r.id} value={r.id}>{r.nombre}</option>
              ))}
            </select>
          </div>
          <div className="field checkbox-field">
            <label>
              <input type="checkbox" checked={formData.es_final} onChange={e => setFormData({ ...formData, es_final: e.target.checked })} />
              Etapa Final (Cierra expediente)
            </label>
          </div>
        </form>
      </section>

      <div className="form-actions">
        <button type="submit" form="etapa-form" className="btn btn-primary">{editandoId ? 'Actualizar' : 'Crear'}</button>
        {editandoId && <button type="button" className="btn btn-secondary" onClick={limpiarFormulario}>Cancelar</button>}
      </div>

      <section className="panel">
        <div className="panel-top table-top">
          <h3>Etapas por Proceso</h3>
          <div className="tabs">
            <button className={`tab-btn ${tabActiva === 'activos' ? 'active' : ''}`} onClick={() => setTabActiva('activos')}>Activos</button>
            <button className={`tab-btn ${tabActiva === 'inactivos' ? 'active' : ''}`} onClick={() => setTabActiva('inactivos')}>Inactivos</button>
          </div>
        </div>
        <div className="table-wrap">
          <table className="users-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Orden</th>
                <th>Proceso</th>
                <th>Tipo Tarea</th>
                <th>Rol</th>
                <th>Es Final</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtrarData().map(etapa => {
                const proc = procesos.find(p => p.id === etapa.proceso_id)
                const rol = roles.find(r => r.id === etapa.rol_id)
                return (
                  <tr key={etapa.id}>
                    <td>{etapa.nombre}</td>
                    <td>{etapa.orden}</td>
                    <td>{proc?.nombre || 'Sin proceso'}</td>
                    <td>{etapa.tipo_tarea || '-'}</td>
                    <td>{rol?.nombre || '-'}</td>
                    <td>{etapa.es_final ? '✓' : 'No'}</td>
                    <td>
                      <button className="btn-mini btn-edit" onClick={() => handleEditar(etapa)}>Editar</button>
                      <button className="btn-mini btn-danger" onClick={() => cambiarEstado(etapa.id, !etapa.estado_activo)}>{etapa.estado_activo ? 'Borrar' : 'Reactivar'}</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}

export default EtapasPanel
