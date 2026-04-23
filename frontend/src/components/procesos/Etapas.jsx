import { useState, useEffect } from 'react'
import { useEtapas } from '../../hooks/useEtapas'
import { useProcesos } from '../../hooks/useProcesos'
import { useUsuarios } from '../../hooks/useUsuarios'
import { useAreas } from '../../hooks/useAreas'

const EtapasPanel = () => {
  const { etapas, loading, cargarEtapas, crearEtapa, actualizarEtapa, cambiarEstado } = useEtapas()
  const { procesos, cargarProcesos } = useProcesos()
  const { usuarios, cargarUsuarios } = useUsuarios()

  const [formData, setFormData] = useState({
    proceso_id: '',
    nombre: '',
    orden: '',
    es_final: false,
    requiere_aprobador: false,
    usuario_asignado_id: ''
  })
  const [editandoId, setEditandoId] = useState(null)
  const [tabActiva, setTabActiva] = useState('activos')
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => {
    Promise.all([cargarEtapas(), cargarProcesos(), cargarUsuarios()])
  }, [cargarEtapas, cargarProcesos, cargarUsuarios])

  const limpiarFormulario = () => {
    setFormData({
      proceso_id: '',
      nombre: '',
      orden: '',
      es_final: false,
      requiere_aprobador: false,
      usuario_asignado_id: ''
    })
    setEditandoId(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
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
      requiere_aprobador: e.requiere_aprobador,
      usuario_asignado_id: String(e.usuario_asignado_id || '')
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
        <form onSubmit={handleSubmit} className="form-grid">
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
            <label>Usuario Asignado (opcional)</label>
            <select value={formData.usuario_asignado_id} onChange={e => setFormData({ ...formData, usuario_asignado_id: e.target.value })}>
              <option value="">Sin asignar</option>
              {usuarios.filter(u => u.estado_activo).map(u => (
                <option key={u.id} value={u.id}>{u.nombre_completo} ({u.rol_nombre})</option>
              ))}
            </select>
          </div>
          <div className="field checkbox-field">
            <label>
              <input type="checkbox" checked={formData.es_final} onChange={e => setFormData({ ...formData, es_final: e.target.checked })} />
              Etapa Final (Cierra expediente)
            </label>
          </div>
          <div className="field checkbox-field">
            <label>
              <input type="checkbox" checked={formData.requiere_aprobador} onChange={e => setFormData({ ...formData, requiere_aprobador: e.target.checked })} />
              Requiere Aprobador (Avance automático deshabilitado)
            </label>
          </div>
        </form>
      </section>

      <div className="form-actions">
        <button type="submit" className="btn btn-primary">{editandoId ? 'Actualizar' : 'Crear'}</button>
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
                <th>Usuario Asignado</th>
                <th>Req. Aprobador</th>
                <th>Es Final</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtrarData().map(etapa => {
                const proc = procesos.find(p => p.id === etapa.proceso_id)
                const usuario = usuarios.find(u => u.id === etapa.usuario_asignado_id)
                return (
                  <tr key={etapa.id}>
                    <td>{etapa.nombre}</td>
                    <td>{etapa.orden}</td>
                    <td>{proc?.nombre || 'Sin proceso'}</td>
                    <td>{usuario?.nombre_completo || '-'}</td>
                    <td>{etapa.requiere_aprobador ? '✓' : 'No'}</td>
                    <td>{etapa.es_final ? '✓' : 'No'}</td>
                    <td>
                      <button className="btn-mini btn-edit" onClick={() => handleEditar(etapa)}>Editar</button>
                      <button className="btn-mini btn-danger" onClick={() => cambiarEstado(etapa.id, !etapa.estado_activo)}>Borrar</button>
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