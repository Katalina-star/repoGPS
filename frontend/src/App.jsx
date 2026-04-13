import { useState, useEffect } from 'react'
import './index.css'

function App() {
  const [roles, setRoles] = useState([])
  const [usuarios, setUsuarios] = useState([])
  const [errorBd, setErrorBd] = useState(null)
  const [editandoId, setEditandoId] = useState(null)
  const [busqueda, setBusqueda] = useState('')

  const [formData, setFormData] = useState({
    rol_id: '',
    nombre_completo: '',
    correo: '',
    password_hash: '123456'
  })

  const cargarRoles = async () => {
    try {
      const res = await fetch('http://68.183.100.49:3000/api/roles')
      const data = await res.json()
      if (Array.isArray(data)) setRoles(data)
      else setErrorBd(data.error || 'Error al cargar roles')
    } catch {
      setErrorBd('El backend está apagado o inalcanzable')
    }
  }

  const cargarUsuarios = async () => {
    try {
      const res = await fetch('http://68.183.100.49:3000/api/usuarios')
      const data = await res.json()
      if (Array.isArray(data)) setUsuarios(data)
      else setErrorBd(data.error || 'Error al cargar usuarios')
    } catch {
      setErrorBd('No se pudieron cargar los usuarios')
    }
  }

  useEffect(() => {
    const inicializarDatos = async () => {
      await cargarRoles()
      await cargarUsuarios()
    }
    
    inicializarDatos()
  }, [])

  const limpiarFormulario = () => {
    setFormData({
      rol_id: '',
      nombre_completo: '',
      correo: '',
      password_hash: '123456'
    })
    setEditandoId(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      const usuarioActual = usuarios.find((u) => u.id === editandoId)

      const bodyData = editandoId
        ? {
            ...formData,
            rol_id: Number(formData.rol_id),
            estado_activo: usuarioActual?.estado_activo ?? true
          }
        : {
            ...formData,
            rol_id: Number(formData.rol_id)
          }

      const url = editandoId
        ? `http://68.183.100.49:3000/api/usuarios/${editandoId}`
        : 'http://68.183.100.49:3000/api/usuarios'

      const method = editandoId ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData)
      })

      const data = await response.json()

      if (response.ok) {
        limpiarFormulario()
        cargarUsuarios()
      } else {
        alert(data.error || 'Error al guardar usuario')
      }
    } catch {
      alert('Error al guardar usuario')
    }
  }

  const handleEditar = (usuario) => {
    setFormData({
      rol_id: usuario.rol_id,
      nombre_completo: usuario.nombre_completo,
      correo: usuario.correo,
      password_hash: usuario.password_hash || '123456'
    })
    setEditandoId(usuario.id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const cambiarEstado = async (usuario) => {
    try {
      const response = await fetch(`http://68.183.100.49:3000/api/usuarios/${usuario.id}/estado`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          estado_activo: !usuario.estado_activo
        })
      })

      const data = await response.json()

      if (response.ok) {
        cargarUsuarios()
      } else {
        alert(data.error || 'Error al cambiar estado')
      }
    } catch {
      alert('Error al cambiar estado')
    }
  }

  const eliminarUsuario = async (usuario) => {
    const confirmar = window.confirm(
      `¿Seguro que deseas eliminar definitivamente a ${usuario.nombre_completo}?`
    )
    if (!confirmar) return

    try {
      const response = await fetch(`http://68.183.100.49:3000/api/usuarios/${usuario.id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (response.ok) {
        cargarUsuarios()
        if (editandoId === usuario.id) limpiarFormulario()
      } else {
        alert(data.error || 'Error al eliminar usuario')
      }
    } catch {
      alert('Error al eliminar usuario')
    }
  }

  const usuariosFiltrados = usuarios.filter((usuario) => {
    const texto = busqueda.toLowerCase()
    return (
      usuario.nombre_completo.toLowerCase().includes(texto) ||
      usuario.correo.toLowerCase().includes(texto) ||
      usuario.rol_nombre.toLowerCase().includes(texto)
    )
  })

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">GS</div>
          <div>
            <h2>repoGPS</h2>
            <p>Admin Panel</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          <span className="nav-title">Gestión</span>
          <button className="nav-item active">Usuarios</button>
          <button className="nav-item">Roles</button>
          <button className="nav-item">Áreas</button>
        </nav>
      </aside>

      <main className="content">
        <header className="content-header">
          <div>
            <h1>Gestión de Usuarios</h1>
            <p>Administración de cuentas, roles funcionales y estados</p>
          </div>
        </header>

        {errorBd && (
          <div className="alert-error">
            <strong>Error:</strong> {errorBd}
          </div>
        )}

        <section className="panel">
          <div className="panel-top">
            <div>
              <h3>{editandoId ? 'Editar usuario' : 'Nuevo usuario'}</h3>
              <p>{editandoId ? 'Modifica los datos del usuario seleccionado' : 'Crea una nueva cuenta de usuario'}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="form-grid">
            <div className="field">
              <label>Nombre completo</label>
              <input
                type="text"
                placeholder="Ej: María Ignacia Zapata"
                value={formData.nombre_completo}
                onChange={(e) =>
                  setFormData({ ...formData, nombre_completo: e.target.value })
                }
                required
              />
            </div>

            <div className="field">
              <label>Correo electrónico</label>
              <input
                type="email"
                placeholder="Ej: usuario@correo.com"
                value={formData.correo}
                onChange={(e) =>
                  setFormData({ ...formData, correo: e.target.value })
                }
                required
              />
            </div>

            <div className="field field-full">
              <label>Rol funcional</label>
              <select
                value={formData.rol_id}
                onChange={(e) =>
                  setFormData({ ...formData, rol_id: e.target.value })
                }
                required
              >
                <option value="">Seleccione un rol...</option>
                {roles.map((rol) => (
                  <option key={rol.id} value={rol.id}>
                    {rol.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                {editandoId ? 'Actualizar usuario' : 'Guardar usuario'}
              </button>

              {editandoId && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={limpiarFormulario}
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="panel">
          <div className="panel-top table-top">
            <div>
              <h3>Lista de Usuarios</h3>
              <p>Consulta, busca y administra usuarios registrados</p>
            </div>

            <div className="search-box">
              <input
                type="text"
                placeholder="Buscar por nombre, correo o rol..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
          </div>

          <div className="table-wrap">
            <table className="users-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Correo</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuariosFiltrados.length > 0 ? (
                  usuariosFiltrados.map((usuario) => (
                    <tr key={usuario.id}>
                      <td>{usuario.id}</td>
                      <td>{usuario.nombre_completo}</td>
                      <td>{usuario.correo}</td>
                      <td>{usuario.rol_nombre}</td>
                      <td>
                        <span className={usuario.estado_activo ? 'badge badge-active' : 'badge badge-inactive'}>
                          {usuario.estado_activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td>
                        <div className="table-actions">
                          <button
                            className="btn-mini btn-edit"
                            onClick={() => handleEditar(usuario)}
                          >
                            Editar
                          </button>

                          <button
                            className={usuario.estado_activo ? 'btn-mini btn-warning' : 'btn-mini btn-success'}
                            onClick={() => cambiarEstado(usuario)}
                          >
                            {usuario.estado_activo ? 'Desactivar' : 'Activar'}
                          </button>

                          <button
                            className="btn-mini btn-danger"
                            onClick={() => eliminarUsuario(usuario)}
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="empty-state">
                      No hay usuarios registrados
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App