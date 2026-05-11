import { useState, useEffect } from 'react'
import { useAreas } from '../../hooks/useAreas'
import { useUsuarios } from '../../hooks/useUsuarios'

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

  const {
    usuarios,
    usuariosSinArea,
    cargarUsuarios,
    asignarArea
  } = useUsuarios()

  const [formData, setFormData] = useState({ nombre: '', contratista_id: '' })
  const [editandoId, setEditandoId] = useState(null)
  const [tabActiva, setTabActiva] = useState('activos')
  const [busqueda, setBusqueda] = useState('')

  // Panel de usuarios por área
  const [areaSeleccionada, setAreaSeleccionada] = useState(null)
  const [tabUsuarios, setTabUsuarios] = useState('asignados')
  const [busquedaUsuario, setBusquedaUsuario] = useState('')

  useEffect(() => {
    Promise.all([cargarAreas(), cargarContratistas(), cargarUsuarios()])
  }, [cargarAreas, cargarContratistas, cargarUsuarios])

  const limpiarBusqueda = () => setBusqueda('')

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

  const handleCambiarEstado = async (id, nuevoEstado) => {
    try {
      await cambiarEstado(id, nuevoEstado)
      cargarAreas()
    } catch (err) {
      alert(err.message)
    }
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

  // ============================================
  // HANDLERS USUARIOS (HU-20)
  // ============================================

  const usuariosEnArea = () => {
    return usuarios.filter(u => u.area_id === areaSeleccionada && u.estado_activo)
  }

  const usuariosFiltrados = () => {
    let lista = tabUsuarios === 'asignados' ? usuariosEnArea() : usuariosSinArea
    if (!busquedaUsuario) return lista
    const s = busquedaUsuario.toLowerCase()
    return lista.filter(u =>
      u.nombre_completo?.toLowerCase().includes(s) ||
      u.correo?.toLowerCase().includes(s)
    )
  }

  const handleAsignarUsuario = async (usuarioId, areaId) => {
    try {
      await asignarArea(usuarioId, areaId)
      await cargarUsuarios()
    } catch (err) {
      alert(err.message)
    }
  }

  const handleDesasignarUsuario = async (usuarioId) => {
    try {
      await asignarArea(usuarioId, null)
      await cargarUsuarios()
    } catch (err) {
      alert(err.message)
    }
  }

  const limpiarBusquedaUsuarios = () => setBusquedaUsuario('')

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
            <button className={`tab-btn ${tabActiva === 'activos' ? 'active' : ''}`} onClick={() => { setTabActiva('activos'); limpiarBusqueda(); }}>Activos</button>
            <button className={`tab-btn ${tabActiva === 'inactivos' ? 'active' : ''}`} onClick={() => { setTabActiva('inactivos'); limpiarBusqueda(); }}>Inactivos</button>
          </div>
          <div className="table-controls">
            <div className="search-wrapper">
              <span className="search-icon"></span>
              <input
                type="text"
                className="search-input"
                placeholder="Buscar..."
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
              />
            </div>
          </div>
        </div>
        <div className="hint-bar">Click en un área para asignar usuarios</div>
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
                <tr
                  key={a.id}
                  className={areaSeleccionada === a.id ? 'selected-row' : ''}
                  onClick={() => setAreaSeleccionada(areaSeleccionada === a.id ? null : a.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <td>{a.nombre}</td>
                  <td>{a.contratista_nombre || 'No asignada'}</td>
                  <td>
                    <button className="btn-mini btn-edit" onClick={(e) => { e.stopPropagation(); handleEditar(a); }}>Editar</button>
                    <button className="btn-mini btn-danger" onClick={(e) => { e.stopPropagation(); handleCambiarEstado(a.id, !a.estado_activo); }}>{a.estado_activo ? 'Borrar' : 'Reactivar'}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Panel de Usuarios - Solo visible cuando hay un área seleccionada */}
      {areaSeleccionada && (
        <>
          <section className="panel">
            <div className="panel-top">
              <h3>Asignar Usuarios</h3>
              <span className="category-badge">
                Área: {areas.find(a => a.id === areaSeleccionada)?.nombre}
              </span>
            </div>
            <div className="table-controls" style={{ marginTop: '10px', marginBottom: '15px', display: 'flex', justifyContent: 'flex-end' }}>
              <div className="search-wrapper">
                <span className="search-icon"></span>
                <input
                  type="text"
                  className="search-input"
                  placeholder="Buscar usuario..."
                  value={busquedaUsuario}
                  onChange={e => setBusquedaUsuario(e.target.value)}
                />
              </div>
            </div>
            <div className="table-wrap">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Correo</th>
                    <th>Rol</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {tabUsuarios === 'asignados' ? (
                    usuariosFiltrados().length === 0 ? (
                      <tr><td colSpan="4" className="empty-state">No hay usuarios asignados a esta área</td></tr>
                    ) : (
                      usuariosFiltrados().map(u => (
                        <tr key={u.id}>
                          <td>{u.nombre_completo}</td>
                          <td>{u.correo}</td>
                          <td><span className="role-tag">{u.rol_nombre}</span></td>
                          <td>
                            <button
                              className="btn-mini btn-danger"
                              onClick={() => handleDesasignarUsuario(u.id)}
                            >
                              Desasignar
                            </button>
                          </td>
                        </tr>
                      ))
                    )
                  ) : (
                    usuariosFiltrados().length === 0 ? (
                      <tr><td colSpan="4" className="empty-state">No hay usuarios sin área disponible</td></tr>
                    ) : (
                      usuariosFiltrados().map(u => (
                        <tr key={u.id}>
                          <td>{u.nombre_completo}</td>
                          <td>{u.correo}</td>
                          <td><span className="role-tag">{u.rol_nombre}</span></td>
                          <td>
                            <button
                              className="btn-mini btn-primary"
                              onClick={() => handleAsignarUsuario(u.id, areaSeleccionada)}
                            >
                              Asignar
                            </button>
                          </td>
                        </tr>
                      ))
                    )
                  )}
                </tbody>
              </table>
            </div>
            <div className="tabs" style={{ marginTop: '15px' }}>
              <button
                className={`tab-btn ${tabUsuarios === 'asignados' ? 'active' : ''}`}
                onClick={() => { setTabUsuarios('asignados'); limpiarBusquedaUsuarios(); }}
              >
                Asignados ({usuariosEnArea().length})
              </button>
              <button
                className={`tab-btn ${tabUsuarios === 'disponibles' ? 'active' : ''}`}
                onClick={() => { setTabUsuarios('disponibles'); limpiarBusquedaUsuarios(); }}
              >
                Disponibles ({usuariosSinArea.length})
              </button>
            </div>
          </section>
          <div style={{ textAlign: 'center', marginTop: '10px' }}>
            <button
              className="btn btn-outline"
              onClick={() => { setAreaSeleccionada(null); setTabUsuarios('asignados'); setBusquedaUsuario(''); }}
            >
              Cerrar panel
            </button>
          </div>
        </>
      )}
    </>
  )
}

export default AreasPanel
