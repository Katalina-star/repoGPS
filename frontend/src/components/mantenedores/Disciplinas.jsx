import { useState, useEffect } from 'react'
import { useDisciplinas } from '../../hooks/useDisciplinas'

const DisciplinasPanel = () => {
  const {
    disciplinas,
    areas,
    contratistas,
    cargarDisciplinas,
    cargarAreas,
    cargarContratistas,
    crearDisciplina,
    actualizarDisciplina,
    cambiarEstado
  } = useDisciplinas()

  const [formData, setFormData] = useState({ nombre: '', area_id: '', contratista_id: '' })
  const [editandoId, setEditandoId] = useState(null)
  const [tabActiva, setTabActiva] = useState('activos')
  const [busqueda] = useState('')

  useEffect(() => {
    Promise.all([cargarDisciplinas(), cargarAreas(), cargarContratistas()])
  }, [cargarDisciplinas, cargarAreas, cargarContratistas])

  const limpiarFormulario = () => {
    setFormData({ nombre: '', area_id: '', contratista_id: '' })
    setEditandoId(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editandoId) {
        await actualizarDisciplina(editandoId, formData)
      } else {
        await crearDisciplina(formData)
      }
      limpiarFormulario()
      cargarDisciplinas()
    } catch (err) {
      alert(err.message)
    }
  }

  const handleEditar = (d) => {
    setFormData({ 
      nombre: d.nombre, 
      area_id: String(d.area_id), 
      contratista_id: String(d.contratista_id || '') 
    })
    setEditandoId(d.id)
  }

  const filtrarData = (lista) => {
    return lista
      .filter(item => tabActiva === 'activos' ? item.estado_activo : !item.estado_activo)
      .filter(item => {
        const s = busqueda.toLowerCase()
        return item.nombre?.toLowerCase().includes(s) || 
               item.area_nombre?.toLowerCase().includes(s)
      })
  }

  const getTitulo = () => editandoId ? 'Modificar' : 'Registrar'

  return (
    <>
      <section className="panel">
        <div className="panel-top">
          <h3>{getTitulo()} Disciplina</h3>
        </div>
        <form onSubmit={handleSubmit} className="form-grid">
          <div className="field">
            <label>Nombre de la Disciplina</label>
            <input
              type="text"
              value={formData.nombre}
              onChange={e => setFormData({ ...formData, nombre: e.target.value })}
              required
            />
          </div>
          <div className="field">
            <label>Contratista</label>
            <select 
              value={formData.contratista_id} 
              onChange={e => setFormData({ ...formData, contratista_id: e.target.value, area_id: '' })} 
              required
            >
              <option value="">Seleccione...</option>
              {contratistas.filter(c => c.estado_activo).map(c => <option key={c.id} value={c.id}>{c.razon_social}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Área</label>
            <select 
              value={formData.area_id} 
              onChange={e => setFormData({ ...formData, area_id: e.target.value })} 
              required
              disabled={!formData.contratista_id}
            >
              <option value="">Seleccione...</option>
              {areas.filter(a => a.contratista_id === Number(formData.contratista_id) && a.estado_activo).map(a => (
                <option key={a.id} value={a.id}>{a.nombre}</option>
              ))}
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
                <th>Disciplina</th>
                <th>Área</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtrarData(disciplinas).map(d => (
                <tr key={d.id}>
                  <td>{d.nombre}</td>
                  <td>{d.area_nombre || 'No asignada'}</td>
                  <td>
                    <button className="btn-mini btn-edit" onClick={() => handleEditar(d)}>Editar</button>
                    <button className="btn-mini btn-danger" onClick={() => cambiarEstado(d.id, !d.estado_activo)}>{d.estado_activo ? 'Borrar' : 'Reactivar'}</button>
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

export default DisciplinasPanel