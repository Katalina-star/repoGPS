import { useState, useEffect } from 'react'
import { useAreas } from '../../hooks/useAreas'

const AreasPanel = () => {
  const {
    areas,
    contratistas,
    cargarAreas,
    cargarContratistas,
    crearArea,
    actualizarArea,
    cambiarEstado
  } = useAreas()

  const [formData, setFormData] = useState({ nombre: '', contratista_id: '' })
  const [editandoId, setEditandoId] = useState(null)
  const [tabActiva, setTabActiva] = useState('activos')
  const [busqueda] = useState('')

  useEffect(() => {
    Promise.all([cargarAreas(), cargarContratistas()])
  }, [cargarAreas, cargarContratistas])

  const limpiarFormulario = () => {
    setFormData({ nombre: '', contratista_id: '' })
    setEditandoId(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editandoId) {
        await actualizarArea(editandoId, formData)
      } else {
        await crearArea(formData)
      }
      limpiarFormulario()
      cargarAreas()
    } catch (err) {
      alert(err.message)
    }
  }

  const handleEditar = (a) => {
    setFormData({ nombre: a.nombre, contratista_id: String(a.contratista_id) })
    setEditandoId(a.id)
  }

  const filtrarData = (lista) => {
    return lista
      .filter(item => tabActiva === 'activos' ? item.estado_activo : !item.estado_activo)
      .filter(item => {
        const s = busqueda.toLowerCase()
        return item.nombre?.toLowerCase().includes(s) || 
               item.contratista_nombre?.toLowerCase().includes(s)
      })
  }

  const getTitulo = () => editandoId ? 'Modificar' : 'Registrar'

  return (
    <>
      <section className="panel">
        <div className="panel-top">
          <h3>{getTitulo()} Área</h3>
        </div>
        <form onSubmit={handleSubmit} className="form-grid">
          <div className="field">
            <label>Nombre del Área</label>
            <input
              type="text"
              value={formData.nombre}
              onChange={e => setFormData({ ...formData, nombre: e.target.value })}
              required
            />
          </div>
          <div className="field">
            <label>Empresa Contratista</label>
            <select
              value={formData.contratista_id}
              onChange={e => setFormData({ ...formData, contratista_id: e.target.value })}
              required
            >
              <option value="">Seleccione...</option>
              {contratistas.filter(c => c.estado_activo).map(c => <option key={c.id} value={c.id}>{c.razon_social}</option>)}
            </select>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary">{editandoId ? 'Actualizar' : 'Crear'}</button>
            {editandoId && <button type="button" className="btn btn-secondary" onClick={limpiarFormulario}>Cancelar</button>}
          </div>
        </form>
      </section>

      <section className="panel">
        <div className="panel-top table-top">
          <div className="tabs">
            <button className={`tab-btn ${tabActiva === 'activos' ? 'active' : ''}`} onClick={() => setTabActiva('activos')}>Activos</button>
            <button className={`tab-btn ${tabActiva === 'inactivos' ? 'active' : ''}`} onClick={() => setTabActiva('inactivos')}>Inactivos</button>
          </div>
        </div>
        <div className="table-wrap">
          <table className="users-table">
            <thead>
              <tr>
                <th>Área</th>
                <th>Empresa</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtrarData(areas).map(a => (
                <tr key={a.id}>
                  <td>{a.nombre}</td>
                  <td>{a.contratista_nombre || 'No asignada'}</td>
                  <td>
                    <button className="btn-mini btn-edit" onClick={() => handleEditar(a)}>Editar</button>
                    <button className="btn-mini btn-danger" onClick={() => cambiarEstado(a.id, !a.estado_activo)}>{a.estado_activo ? 'Borrar' : 'Reactivar'}</button>
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

export default AreasPanel