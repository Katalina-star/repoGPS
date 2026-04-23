import { useState, useEffect } from 'react'
import { useContratistas } from '../../hooks/useContratistas'

const ContratistasPanel = () => {
  const {
    contratistas,
    cargarContratistas,
    crearContratista,
    actualizarContratista,
    cambiarEstado
  } = useContratistas()

  const [formData, setFormData] = useState({ razon_social: '', rut: '' })
  const [editandoId, setEditandoId] = useState(null)
  const [tabActiva, setTabActiva] = useState('activos')
  const [busqueda] = useState('')
  const [errorRut, setErrorRut] = useState('')

  useEffect(() => {
    cargarContratistas()
  }, [cargarContratistas])

  const limpiarFormulario = () => {
    setFormData({ razon_social: '', rut: '' })
    setEditandoId(null)
    setErrorRut('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorRut('')
    try {
      if (editandoId) {
        await actualizarContratista(editandoId, formData)
      } else {
        await crearContratista(formData)
      }
      limpiarFormulario()
      cargarContratistas()
    } catch (err) {
      if (err.message.includes('RUT')) {
        setErrorRut(err.message)
      } else {
        alert(err.message)
      }
    }
  }

  const handleEditar = (c) => {
    setFormData({ razon_social: c.razon_social, rut: c.rut })
    setEditandoId(c.id)
  }

  const filtrarData = (lista) => {
    return lista
      .filter(item => tabActiva === 'activos' ? item.estado_activo : !item.estado_activo)
      .filter(item => {
        const s = busqueda.toLowerCase()
        return item.razon_social?.toLowerCase().includes(s) || item.rut?.toLowerCase().includes(s)
      })
  }

  const getTitulo = () => editandoId ? 'Modificar' : 'Registrar'

  return (
    <>
      <section className="panel">
        <div className="panel-top">
          <h3>{getTitulo()} Contratista</h3>
        </div>
        <form onSubmit={handleSubmit} className="form-grid">
          <div className="field">
            <label>Razón Social</label>
            <input
              type="text"
              value={formData.razon_social}
              onChange={e => setFormData({ ...formData, razon_social: e.target.value })}
              required
            />
          </div>
          <div className="field">
            <label>RUT</label>
            <input
              type="text"
              value={formData.rut}
              onChange={e => { setFormData({ ...formData, rut: e.target.value }); setErrorRut(''); }}
              required
            />
            {errorRut && <span style={{ color: '#e74c3c', fontSize: '12px', display: 'block', marginTop: '4px' }}>{errorRut}</span>}
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
                <th>Razón Social</th>
                <th>RUT</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtrarData(contratistas).map(c => (
                <tr key={c.id}>
                  <td>{c.razon_social}</td>
                  <td>{c.rut}</td>
                  <td>
                    <button className="btn-mini btn-edit" onClick={() => handleEditar(c)}>Editar</button>
                    <button className="btn-mini btn-danger" onClick={() => cambiarEstado(c.id, !c.estado_activo)}>{c.estado_activo ? 'Borrar' : 'Reactivar'}</button>
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

export default ContratistasPanel