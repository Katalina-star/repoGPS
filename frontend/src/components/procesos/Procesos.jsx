import { useState, useEffect } from 'react'
import { useProcesos } from '../../hooks/useProcesos'
import { useAreas } from '../../hooks/useAreas'

const ProcesosPanel = () => {
  const { procesos, loading, cargarProcesos, crearProceso, actualizarProceso, cambiarEstado } = useProcesos()
  const { areas, cargarAreas } = useAreas()

  const [formData, setFormData] = useState({ area_id: '', nombre: '', descripcion: '' })
  const [editandoId, setEditandoId] = useState(null)
  const [tabActiva, setTabActiva] = useState('activos')
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => {
    Promise.all([cargarProcesos(), cargarAreas()])
  }, [cargarProcesos, cargarAreas])

  const limpiarFormulario = () => {
    setFormData({ area_id: '', nombre: '', descripcion: '' })
    setEditandoId(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editandoId) {
        await actualizarProceso(editandoId, formData)
      } else {
        await crearProceso(formData)
      }
      limpiarFormulario()
      cargarProcesos()
    } catch (err) {
      alert(err.message)
    }
  }

  const handleEditar = (p) => {
    setFormData({ area_id: String(p.area_id), nombre: p.nombre, descripcion: p.descripcion || '' })
    setEditandoId(p.id)
  }

  const filtrarData = () => {
    return procesos
      .filter(p => tabActiva === 'activos' ? p.estado_activo : !p.estado_activo)
      .filter(p => {
        const s = busqueda.toLowerCase()
        return p.nombre?.toLowerCase().includes(s) || p.descripcion?.toLowerCase().includes(s)
      })
  }

  const getTitulo = () => editandoId ? 'Modificar' : 'Registrar'

  return (
    <>
      <section className="panel">
        <div className="panel-top">
          <h3>{getTitulo()} Proceso</h3>
        </div>
        <form onSubmit={handleSubmit} className="form-grid">
          <div className="field">
            <label>Área</label>
            <select value={formData.area_id} onChange={e => setFormData({ ...formData, area_id: e.target.value })} required>
              <option value="">Seleccione...</option>
              {areas.filter(a => a.estado_activo).map(a => (
                <option key={a.id} value={a.id}>{a.nombre} ({a.contratista_nombre})</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Nombre del Proceso</label>
            <input type="text" value={formData.nombre} onChange={e => setFormData({ ...formData, nombre: e.target.value })} required />
          </div>
          <div className="field">
            <label>Descripción</label>
            <textarea value={formData.descripcion} onChange={e => setFormData({ ...formData, descripcion: e.target.value })} />
          </div>
        </form>
      </section>

      <div className="form-actions">
        <button type="submit" className="btn btn-primary">{editandoId ? 'Actualizar' : 'Crear'}</button>
        {editandoId && <button type="button" className="btn btn-secondary" onClick={limpiarFormulario}>Cancelar</button>}
      </div>

      <section className="panel">
        <div className="panel-top table-top">
          <h3>Procesos por Área</h3>
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
                <th>Descripción</th>
                <th>Área</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtrarData().map(p => {
                const area = areas.find(a => a.id === p.area_id)
                return (
                  <tr key={p.id}>
                    <td>{p.nombre}</td>
                    <td>{p.descripcion || '-'}</td>
                    <td>{area?.nombre || 'Sin área'}</td>
                    <td>
                      <button className="btn-mini btn-edit" onClick={() => handleEditar(p)}>Editar</button>
                      <button className="btn-mini btn-danger" onClick={() => cambiarEstado(p.id, !p.estado_activo)}>Borrar</button>
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

export default ProcesosPanel