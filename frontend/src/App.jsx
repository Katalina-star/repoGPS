import { useState, useEffect, useCallback } from 'react'
import Login from './Login'
import './index.css'

function App() {
  // Inicializar estado desde localStorage directamente (evita useEffect)
  const [usuario, setUsuario] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('usuario')
      return stored ? JSON.parse(stored) : null
    }
    return null
  })
  const [roles, setRoles] = useState([])
  const [areas, setAreas] = useState([])
  const [usuarios, setUsuarios] = useState([])
  const [contratistas, setContratistas] = useState([])
  const [disciplinas, setDisciplinas] = useState([])
  
  const [seccionActual, setSeccionActual] = useState('usuarios')
  const [tabActiva, setTabActiva] = useState('activos') 
  const [errorBd, setErrorBd] = useState(null)
  const [editandoId, setEditandoId] = useState(null)
  const [busqueda, setBusqueda] = useState('')

  const [formData, setFormData] = useState({
    rol_id: '', area_id: '', nombre_completo: '', correo: '', password_hash: '123456'
  })
  const [formContratista, setFormContratista] = useState({ razon_social: '', rut: '' })
  const [formArea, setFormArea] = useState({ nombre: '', contratista_id: '' })
  const [formDisciplina, setFormDisciplina] = useState({ nombre: '', area_id: '', contratista_id: '' })

  const API_URL = import.meta.env.VITE_API_URL || '';

  // --- CARGA CONTRATISTAS, DISCIPLINAS ---
  const cargarContratistas = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/contratistas`)
      const data = await res.json()
      if (Array.isArray(data)) setContratistas(data)
    } catch { setErrorBd('Error al conectar con contratistas') }
  }, [API_URL])

  const cargarDisciplinas = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/disciplinas`)
      const data = await res.json()
      if (Array.isArray(data)) setDisciplinas(data)
    } catch { setErrorBd('Error al cargar disciplinas') }
  }, [API_URL])

  useEffect(() => {
    const fetchData = async () => {
      const [rolesRes, areasRes, usuariosRes] = await Promise.all([
        fetch(`${API_URL}/api/roles`),
        fetch(`${API_URL}/api/areas`),
        fetch(`${API_URL}/api/usuarios`),
      ])
      const [rolesData, areasData, usuariosData] = await Promise.all([
        rolesRes.json(),
        areasRes.json(),
        usuariosRes.json(),
      ])
      if (Array.isArray(rolesData)) setRoles(rolesData)
      if (Array.isArray(areasData)) setAreas(areasData)
      if (Array.isArray(usuariosData)) setUsuarios(usuariosData)
      else if (usuariosData.error) setErrorBd(usuariosData.error)
    }
    fetchData()
  // Cargar datos al inicio - incluye contratistas y disciplinas
  const inicializar = useCallback(async () => {
    const fetchData = async () => {
      const [rolesRes, areasRes, usuariosRes] = await Promise.all([
        fetch(`${API_URL}/api/roles`),
        fetch(`${API_URL}/api/areas`),
        fetch(`${API_URL}/api/usuarios`),
      ])
      const [rolesData, areasData, usuariosData] = await Promise.all([
        rolesRes.json(),
        areasRes.json(),
        usuariosRes.json(),
      ])
      if (Array.isArray(rolesData)) setRoles(rolesData)
      if (Array.isArray(areasData)) setAreas(areasData)
      if (Array.isArray(usuariosData)) setUsuarios(usuariosData)
      else if (usuariosData.error) setErrorBd(usuariosData.error)
      
      // Cargar mantenedores
      const [contratistasRes, disciplinasRes] = await Promise.all([
        fetch(`${API_URL}/api/contratistas`),
        fetch(`${API_URL}/api/disciplinas`),
      ])
      const [contratistasData, disciplinasData] = await Promise.all([
        contratistasRes.json(),
        disciplinasRes.json(),
      ])
      if (Array.isArray(contratistasData)) setContratistas(contratistasData)
      if (Array.isArray(disciplinasData)) setDisciplinas(disciplinasData)
    }
    fetchData()
  }, [API_URL])

  useEffect(() => {
inicializar()
  }, [inicializar])

  const cargarContratistas = useCallback(async () => {
    const res = await fetch(`${API_URL}/api/contratistas`)
    const data = await res.json()
    if (Array.isArray(data)) setContratistas(data)
  }, [API_URL])

  const cargarDisciplinas = useCallback(async () => {
    const res = await fetch(`${API_URL}/api/disciplinas`)
    const data = await res.json()
    if (Array.isArray(data)) setDisciplinas(data)
  }, [API_URL])

  const cargarUsuarios = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/usuarios`)
      const data = await res.json()
      if (Array.isArray(data)) setUsuarios(data)
      else setErrorBd(data.error || 'Error al cargar usuarios')
    } catch {
      setErrorBd('El backend está apagado o inalcanzable')
    }
  }, [API_URL])

  const handleLogin = (user) => {
    setUsuario(user)
  }

  const handleLogout = async () => {
    try {
      await fetch(`${API_URL}/api/logout`, { method: 'POST' })
    } catch {
      // Ignorar errores al cerrar sesión
    }
    localStorage.removeItem('token')
    localStorage.removeItem('usuario')
    setUsuario(null)
  }

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
      const url = editandoId 
        ? `${API_URL}/api/usuarios/${editandoId}` 
        : `${API_URL}/api/usuarios`
      
      const method = editandoId ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          rol_id: Number(formData.rol_id),
          area_id: Number(formData.area_id)
        })
      })

      if (response.ok) {
        limpiarFormulario()
        cargarUsuarios()
      } else {
        const data = await response.json()
        alert(data.error || 'Error al procesar la solicitud')
      }
    } catch {
      alert('Error de conexión al guardar')
    }
  }

  const handleEditar = (usuario) => {
    setFormData({
      rol_id: usuario.rol_id,
      area_id: usuario.area_id || '',
      nombre_completo: usuario.nombre_completo,
      correo: usuario.correo,
      password_hash: usuario.password_hash || '123456'
    })
    setEditandoId(usuario.id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const cambiarEstadoUsuario = async (id, nuevoEstado) => {
    const confirmacion = nuevoEstado 
      ? '¿Deseas reactivar este usuario?' 
      : '¿Seguro que deseas mover este usuario a la papelera (desactivar)?'
    
    if (!window.confirm(confirmacion)) return

    try {
      const response = await fetch(`${API_URL}/api/usuarios/${id}/estado`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado_activo: nuevoEstado })
      })

      if (response.ok) {
        cargarUsuarios()
      } else {
        alert('Error al cambiar el estado')
      }
    } catch {
      alert('Error de conexión')
    }
  }

  const usuariosFiltradosPorTab = usuarios.filter(u => 
    tabActiva === 'activos' ? u.estado_activo : !u.estado_activo
  )

  const listaFinal = usuariosFiltradosPorTab.filter(u => {
    const search = busqueda.toLowerCase()
    return (
      u.nombre_completo.toLowerCase().includes(search) ||
      u.correo.toLowerCase().includes(search) ||
      (u.area_nombre && u.area_nombre.toLowerCase().includes(search))
    )
  })

  // Si no hay usuario logueado, mostrar Login
  if (!usuario) {
    return <Login onLogin={handleLogin} />
  }

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
          <button className={`nav-item ${seccionActual === 'usuarios' ? 'active' : ''}`} onClick={() => setSeccionActual('usuarios')}>Usuarios</button>
          <button className={`nav-item ${seccionActual === 'contratistas' ? 'active' : ''}`} onClick={() => setSeccionActual('contratistas')}>Contratistas</button>
          <button className={`nav-item ${seccionActual === 'areas' ? 'active' : ''}`} onClick={() => setSeccionActual('areas')}>Áreas</button>
          <button className={`nav-item ${seccionActual === 'disciplinas' ? 'active' : ''}`} onClick={() => setSeccionActual('disciplinas')}>Disciplinas</button>
        </nav>
        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            Cerrar Sesión
          </button>
        </div>
      </aside>

      <main className="content">
        <header className="content-header">
          <div>
            <h1>Gestión de Usuarios</h1>
            <p>Administración de accesos y jerarquías del sistema</p>
          </div>
        </header>

        {errorBd && <div className="alert-error"><strong>Error:</strong> {errorBd}</div>}

        <section className="panel">
          <div className="panel-top">
            <h3>{editandoId ? 'Modificar Usuario' : 'Registrar Nuevo Usuario'}</h3>
          </div>
          <form onSubmit={handleSubmit} className="form-grid">
            <div className="field">
              <label>Nombre Completo</label>
              <input 
                type="text" 
                placeholder="Ej: María Ignacia Zapata"
                value={formData.nombre_completo}
                onChange={e => setFormData({...formData, nombre_completo: e.target.value})}
                required 
              />
            </div>
            <div className="field">
              <label>Correo Electrónico</label>
              <input 
                type="email" 
                placeholder="Ej: usuario@correo.com"
                value={formData.correo}
                onChange={e => setFormData({...formData, correo: e.target.value})}
                required 
              />
            </div>
            <div className="field">
              <label>Rol Funcional</label>
              <select 
                value={formData.rol_id} 
                onChange={e => setFormData({...formData, rol_id: e.target.value})} 
                required
              >
                <option value="">Seleccione un rol...</option>
                {roles.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Área / Departamento</label>
              <select 
                value={formData.area_id} 
                onChange={e => setFormData({...formData, area_id: e.target.value})} 
                required
              >
                <option value="">Seleccione un área...</option>
                {areas.map(a => (
                  <option key={a.id} value={a.id}>{a.nombre} ({a.contratista_nombre})</option>
                ))}
              </select>
            </div>
            <div className="form-actions" style={{ gridColumn: '1 / -1' }}>
              <button type="submit" className="btn btn-primary">
                {editandoId ? 'Actualizar Cambios' : 'Crear Usuario'}
              </button>
              {editandoId && (
                <button type="button" className="btn btn-secondary" onClick={limpiarFormulario}>
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="panel">
          <div className="panel-top table-top">
            <div className="tabs">
              <button 
                className={`tab-btn ${tabActiva === 'activos' ? 'active' : ''}`}
                onClick={() => setTabActiva('activos')}
              >
                Activos 
              </button>
              <button 
                className={`tab-btn ${tabActiva === 'inactivos' ? 'active' : ''}`}
                onClick={() => setTabActiva('inactivos')}
              >
                Inactivos 
              </button>
            </div>
            <div className="search-box">
              <input 
                type="text" 
                placeholder="Filtrar por nombre o área..." 
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
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
                  <th>Área</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {listaFinal.length > 0 ? (
                  listaFinal.map(u => (
                    <tr key={u.id}>
                      <td>{u.nombre_completo}</td>
                      <td>{u.correo}</td>
                      <td><span className="role-tag">{u.rol_nombre}</span></td>
                      <td>{u.area_nombre || 'No asignada'}</td>
                      <td>
                        <div className="table-actions">
                          {tabActiva === 'activos' ? (
                            <>
                              <button className="btn-mini btn-edit" onClick={() => handleEditar(u)}>Editar</button>
                              <button className="btn-mini btn-danger" onClick={() => cambiarEstadoUsuario(u.id, false)}>Eliminar</button>
                            </>
                          ) : (
                            <button className="btn-mini btn-success" onClick={() => cambiarEstadoUsuario(u.id, true)}>Reactivar</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="5" className="empty-state">No se encontraron registros</td></tr>
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