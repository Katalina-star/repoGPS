import { useState, useEffect } from 'react'
import './index.css'

function App({ onLogout }) {
  // --- ESTADOS DE DATOS ---
  const [roles, setRoles] = useState([])
  const [areas, setAreas] = useState([])
  const [usuarios, setUsuarios] = useState([])
  const [contratistas, setContratistas] = useState([])

  // --- NAVEGACIÓN Y UI ---
  const [seccionActual, setSeccionActual] = useState('usuarios') // 'usuarios', 'contratistas', 'areas'
  const [tabActiva, setTabActiva] = useState('activos')
  const [errorBd, setErrorBd] = useState(null)
  const [editandoId, setEditandoId] = useState(null)
  const [busqueda, setBusqueda] = useState('')

  // --- FORMULARIOS ---
  const [formData, setFormData] = useState({
    rol_id: '',
    area_id: '',
    nombre_completo: '',
    correo: '',
    password_hash: '123456'
  })

  const [formContratista, setFormContratista] = useState({
    razon_social: '',
    rut: ''
  })

  const [formArea, setFormArea] = useState({
    contratista_id: '',
    nombre: ''
  })

  const API_URL = import.meta.env.VITE_API_URL || ''

  // --- FUNCIONES DE CARGA ---
  const cargarRoles = async () => {
    try {
      const res = await fetch(`${API_URL}/api/roles`)
      const data = await res.json()
      if (Array.isArray(data)) setRoles(data)
    } catch { console.error('Error roles') }
  }

  const cargarAreas = async () => {
    try {
      const res = await fetch(`${API_URL}/api/areas`)
      const data = await res.json()
      if (Array.isArray(data)) setAreas(data)
    } catch { console.error('Error áreas') }
  }

  const cargarContratistas = async () => {
    try {
      const res = await fetch(`${API_URL}/api/contratistas`)
      const data = await res.json()
      if (Array.isArray(data)) setContratistas(data)
    } catch { console.error('Error contratistas') }
  }

  const cargarUsuarios = async () => {
    try {
      const res = await fetch(`${API_URL}/api/usuarios`)
      const data = await res.json()
      if (Array.isArray(data)) {
        setUsuarios(data)
        setErrorBd(null)
      }
    } catch { setErrorBd('El backend está inalcanzable') }
  }

  useEffect(() => {
    cargarRoles()
    cargarAreas()
    cargarUsuarios()
    cargarContratistas()
  }, [])

  // --- MANEJADORES DE FORMULARIOS ---
  const limpiarFormulario = () => {
    setFormData({ rol_id: '', area_id: '', nombre_completo: '', correo: '', password_hash: '123456' })
    setFormContratista({ razon_social: '', rut: '' })
    setFormArea({ contratista_id: '', nombre: '' })
    setEditandoId(null)
  }

  const handleSubmitUsuario = async (e) => {
    e.preventDefault()
    try {
      const url = editandoId ? `${API_URL}/api/usuarios/${editandoId}` : `${API_URL}/api/usuarios`
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
        limpiarFormulario(); cargarUsuarios()
      }
    } catch { alert('Error al guardar usuario') }
  }

  const handleSubmitContratista = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch(`${API_URL}/api/contratistas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formContratista)
      })
      if (response.ok) {
        limpiarFormulario(); cargarContratistas()
      }
    } catch { alert('Error al guardar contratista') }
  }

  const handleSubmitArea = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch(`${API_URL}/api/areas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formArea,
          contratista_id: Number(formArea.contratista_id)
        })
      })
      if (response.ok) {
        limpiarFormulario(); cargarAreas()
      }
    } catch { alert('Error al guardar área') }
  }

  // --- ACCIONES COMUNES ---
  const cambiarEstadoEntidad = async (endpoint, id, nuevoEstado) => {
    const msg = nuevoEstado ? '¿Reactivar registro?' : '¿Mover a inactivos?'
    if (!window.confirm(msg)) return
    try {
      const res = await fetch(`${API_URL}/api/${endpoint}/${id}/estado`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado_activo: nuevoEstado })
      })
      if (res.ok) {
        cargarUsuarios(); cargarAreas(); cargarContratistas()
      }
    } catch { alert('Error de conexión') }
  }

  const handleEditarUsuario = (u) => {
    setFormData({
      rol_id: u.rol_id,
      area_id: u.area_id || '',
      nombre_completo: u.nombre_completo,
      correo: u.correo,
      password_hash: u.password_hash || '123456'
    })
    setEditandoId(u.id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // --- FILTROS ---
  const filtrarData = (lista) => {
    return lista.filter(item => tabActiva === 'activos' ? item.estado_activo : !item.estado_activo)
      .filter(item => {
        const s = busqueda.toLowerCase()
        return (item.nombre_completo?.toLowerCase().includes(s) || 
                item.razon_social?.toLowerCase().includes(s) || 
                item.nombre?.toLowerCase().includes(s))
      })
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">GS</div>
          <div><h2>repoGPS</h2><p>Admin Panel</p></div>
        </div>
        <nav className="sidebar-nav">
          <span className="nav-title">Gestión</span>
          <button className={`nav-item ${seccionActual === 'usuarios' ? 'active' : ''}`} onClick={() => setSeccionActual('usuarios')}>Usuarios</button>
          <button className={`nav-item ${seccionActual === 'contratistas' ? 'active' : ''}`} onClick={() => setSeccionActual('contratistas')}>Contratistas</button>
          <button className={`nav-item ${seccionActual === 'areas' ? 'active' : ''}`} onClick={() => setSeccionActual('areas')}>Áreas</button>
        </nav>
        <div className="sidebar-logout">
          <button className="logout-btn" onClick={onLogout}>Cerrar sesión</button>
        </div>
      </aside>

      <main className="content">
        <header className="content-header">
          <h1>Gestión de {seccionActual.charAt(0).toUpperCase() + seccionActual.slice(1)}</h1>
          <p>Administración del sistema repoGPS</p>
        </header>

        {errorBd && <div className="alert-error"><strong>Error:</strong> {errorBd}</div>}

        {/* SECCIÓN FORMULARIOS DINÁMICOS */}
        <section className="panel">
          <div className="panel-top">
            <h3>{editandoId ? 'Modificar Registro' : `Registrar ${seccionActual}`}</h3>
          </div>

          {seccionActual === 'usuarios' && (
            <form onSubmit={handleSubmitUsuario} className="form-grid">
              <div className="field">
                <label>Nombre Completo</label>
                <input type="text" value={formData.nombre_completo} onChange={e => setFormData({...formData, nombre_completo: e.target.value})} required />
              </div>
              <div className="field">
                <label>Correo Electrónico</label>
                <input type="email" value={formData.correo} onChange={e => setFormData({...formData, correo: e.target.value})} required />
              </div>
              <div className="field">
                <label>Rol</label>
                <select value={formData.rol_id} onChange={e => setFormData({...formData, rol_id: e.target.value})} required>
                  <option value="">Seleccione...</option>
                  {roles.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Área</label>
                <select value={formData.area_id} onChange={e => setFormData({...formData, area_id: e.target.value})} required>
                  <option value="">Seleccione...</option>
                  {areas.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                </select>
              </div>
              <div className="form-actions" style={{ gridColumn: '1 / -1' }}>
                <button type="submit" className="btn btn-primary">{editandoId ? 'Actualizar' : 'Crear'}</button>
                {editandoId && <button type="button" className="btn btn-secondary" onClick={limpiarFormulario}>Cancelar</button>}
              </div>
            </form>
          )}

          {seccionActual === 'contratistas' && (
            <form onSubmit={handleSubmitContratista} className="form-grid">
              <div className="field">
                <label>Razón Social</label>
                <input type="text" value={formContratista.razon_social} onChange={e => setFormContratista({...formContratista, razon_social: e.target.value})} required />
              </div>
              <div className="field">
                <label>RUT</label>
                <input type="text" value={formContratista.rut} onChange={e => setFormContratista({...formContratista, rut: e.target.value})} required />
              </div>
              <button type="submit" className="btn btn-primary">Registrar Contratista</button>
            </form>
          )}

          {seccionActual === 'areas' && (
            <form onSubmit={handleSubmitArea} className="form-grid">
              <div className="field">
                <label>Nombre del Área</label>
                <input type="text" value={formArea.nombre} onChange={e => setFormArea({...formArea, nombre: e.target.value})} required />
              </div>
              <div className="field">
                <label>Pertenece a Contratista</label>
                <select value={formArea.contratista_id} onChange={e => setFormArea({...formArea, contratista_id: e.target.value})} required>
                  <option value="">Seleccione contratista...</option>
                  {contratistas.map(c => <option key={c.id} value={c.id}>{c.razon_social}</option>)}
                </select>
              </div>
              <button type="submit" className="btn btn-primary">Registrar Área</button>
            </form>
          )}
        </section>

        {/* TABLA DINÁMICA */}
        <section className="panel">
          <div className="panel-top table-top">
            <div className="tabs">
              <button className={`tab-btn ${tabActiva === 'activos' ? 'active' : ''}`} onClick={() => setTabActiva('activos')}>Activos</button>
              <button className={`tab-btn ${tabActiva === 'inactivos' ? 'active' : ''}`} onClick={() => setTabActiva('inactivos')}>Inactivos</button>
            </div>
            <div className="search-box">
              <input type="text" placeholder="Buscar..." value={busqueda} onChange={e => setBusqueda(e.target.value)} />
            </div>
          </div>

          <div className="table-wrap">
            <table className="users-table">
              <thead>
                <tr>
                  {seccionActual === 'usuarios' && (<><th>Nombre</th><th>Correo</th><th>Rol</th><th>Área</th></>)}
                  {seccionActual === 'contratistas' && (<><th>Razón Social</th><th>RUT</th></>)}
                  {seccionActual === 'areas' && (<><th>Área</th><th>Contratista</th></>)}
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {seccionActual === 'usuarios' && filtrarData(usuarios).map(u => (
                  <tr key={u.id}>
                    <td>{u.nombre_completo}</td><td>{u.correo}</td><td>{u.rol_nombre}</td><td>{u.area_nombre}</td>
                    <td>
                      <button className="btn-mini btn-edit" onClick={() => handleEditarUsuario(u)}>Editar</button>
                      <button className="btn-mini btn-danger" onClick={() => cambiarEstadoEntidad('usuarios', u.id, !u.estado_activo)}>{u.estado_activo ? 'Borrar' : 'Reactivar'}</button>
                    </td>
                  </tr>
                ))}
                {seccionActual === 'contratistas' && filtrarData(contratistas).map(c => (
                  <tr key={c.id}>
                    <td>{c.razon_social}</td><td>{c.rut}</td>
                    <td><button className="btn-mini btn-danger" onClick={() => cambiarEstadoEntidad('contratistas', c.id, !c.estado_activo)}>{c.estado_activo ? 'Borrar' : 'Reactivar'}</button></td>
                  </tr>
                ))}
                {seccionActual === 'areas' && filtrarData(areas).map(a => (
                  <tr key={a.id}>
                    <td>{a.nombre}</td><td>{a.contratista_nombre}</td>
                    <td><button className="btn-mini btn-danger" onClick={() => cambiarEstadoEntidad('areas', a.id, !a.estado_activo)}>{a.estado_activo ? 'Borrar' : 'Reactivar'}</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App