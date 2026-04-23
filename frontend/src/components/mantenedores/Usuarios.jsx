import { useState, useEffect, useCallback } from 'react'
import { useUsuarios } from '../../hooks/useUsuarios'
import { useAuth } from '../../context/AuthContext'

const UsuariosPanel = () => {
  const { logout } = useAuth()
  const {
    usuarios,
    roles,
    areas,
    loading,
    error,
    cargarUsuarios,
    cargarRoles,
    cargarAreas,
    crearUsuario,
    actualizarUsuario,
    cambiarEstado
  } = useUsuarios()

  const [formData, setFormData] = useState({
    rol_id: '',
    area_id: '',
    nombre_completo: '',
    correo: '',
    password_hash: '123456'
  })
  const [editandoId, setEditandoId] = useState(null)
  const [tabActiva, setTabActiva] = useState('activos')
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => {
    Promise.all([cargarUsuarios(), cargarRoles(), cargarAreas()])
  }, [cargarUsuarios, cargarRoles, cargarAreas])

  const limpiarFormulario = () => {
    setFormData({
      rol_id: '',
      area_id: '',
      nombre_completo: '',
      correo: '',
      password_hash: '123456'
    })
    setEditandoId(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editandoId) {
        await actualizarUsuario(editandoId, formData)
      } else {
        await crearUsuario(formData)
      }
      limpiarFormulario()
      cargarUsuarios()
    } catch (err) {
      alert(err.message)
    }
  }

  const handleEditar = (u) => {
    setFormData({
      rol_id: String(u.rol_id),
      area_id: String(u.area_id),
      nombre_completo: u.nombre_completo,
      correo: u.correo,
      password_hash: u.password_hash || '123456'
    })
    setEditandoId(u.id)
  }

  const filtrarData = (lista) => {
    return lista
      .filter(item => tabActiva === 'activos' ? item.estado_activo : !item.estado_activo)
      .filter(item => {
        const s = busqueda.toLowerCase()
        return (
          item.nombre_completo?.toLowerCase().includes(s) ||
          item.correo?.toLowerCase().includes(s) ||
          item.rol_nombre?.toLowerCase().includes(s) ||
          item.area_nombre?.toLowerCase().includes(s)
        )
      })
  }

  const getTitulo = () => editandoId ? 'Modificar' : 'Registrar'

  return (
    <>
      <section className="panel">
        <div className="panel-top">
          <h3>{getTitulo()} Usuario</h3>
        </div>
        <form onSubmit={handleSubmit} className="form-grid">
          <div className="field">
            <label>Nombre Completo</label>
            <input
              type="text"
              value={formData.nombre_completo}
              onChange={e => setFormData({ ...formData, nombre_completo: e.target.value })}
              required
            />
          </div>
          <div className="field">
            <label>Correo</label>
            <input
              type="email"
              value={formData.correo}
              onChange={e => setFormData({ ...formData, correo: e.target.value })}
              required
            />
          </div>
          <div className="field">
            <label>Rol</label>
            <select
              value={formData.rol_id}
              onChange={e => setFormData({ ...formData, rol_id: e.target.value })}
              required
            >
              <option value="">Seleccione...</option>
              {roles.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Área</label>
            <select
              value={formData.area_id}
              onChange={e => setFormData({ ...formData, area_id: e.target.value })}
              required
            >
              <option value="">Seleccione...</option>
              {areas.map(a => <option key={a.id} value={a.id}>{a.nombre} ({a.contratista_nombre})</option>)}
            </select>
          </div>
          <div className="form-actions" style={{ gridColumn: '1 / -1' }}>
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
                <th>Nombre</th>
                <th>Correo</th>
                <th>Rol</th>
                <th>Área</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtrarData(usuarios).map(u => (
                <tr key={u.id}>
                  <td>{u.nombre_completo}</td>
                  <td>{u.correo}</td>
                  <td><span className="role-tag">{u.rol_nombre}</span></td>
                  <td>{u.area_nombre || 'No asignada'}</td>
                  <td>
                    <button className="btn-mini btn-edit" onClick={() => handleEditar(u)}>Editar</button>
                    <button className="btn-mini btn-danger" onClick={() => cambiarEstado(u.id, !u.estado_activo)}>{u.estado_activo ? 'Borrar' : 'Reactivar'}</button>
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

export default UsuariosPanel