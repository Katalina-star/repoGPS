import { useState, useEffect, useCallback } from 'react'
import './index.css'

function App() {
  // ---  ESTADOS DE DATOS ---
  const [roles, setRoles] = useState([])
  const [areas, setAreas] = useState([])
  const [usuarios, setUsuarios] = useState([])
  const [contratistas, setContratistas] = useState([]) 

  // ---  ESTADOS DE UI Y NAVEGACIÓN ---
  const [seccionActual, setSeccionActual] = useState('usuarios') 
  const [tabActiva, setTabActiva] = useState('activos') 
  const [errorBd, setErrorBd] = useState(null)
  const [editandoId, setEditandoId] = useState(null)
  const [busqueda, setBusqueda] = useState('')

  const API_URL = import.meta.env.VITE_API_URL || '';

  // ---  FUNCIONES DE CARGA ---
  const cargarRoles = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/roles`)
      const data = await res.json()
      if (Array.isArray(data)) setRoles(data)
    } catch { setErrorBd('Error al conectar con roles') }
  }, [API_URL]);

  const cargarAreas = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/areas`)
      const data = await res.json()
      if (Array.isArray(data)) setAreas(data)
    } catch { console.error('Error al cargar áreas') }
  }, [API_URL]);

  const cargarUsuarios = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/usuarios`)
      const data = await res.json()
      if (Array.isArray(data)) setUsuarios(data)
      else setErrorBd(data.error || 'Error al cargar usuarios')
    } catch { setErrorBd('El backend de usuarios está inalcanzable') }
  }, [API_URL]);

  const cargarContratistas = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/contratistas`)
      const data = await res.json()
      if (Array.isArray(data)) setContratistas(data)
    } catch { console.error('Error al cargar contratistas') }
  }, [API_URL]);

  // Se incluyen todas las dependencias para que el pipeline pase sin advertencias
  useEffect(() => {
    const inicializar = async () => {
      await Promise.all([cargarRoles(), cargarAreas(), cargarUsuarios(), cargarContratistas()])
    }
    inicializar()
  }, [cargarRoles, cargarAreas, cargarUsuarios, cargarContratistas])

  // ---  FORMULARIOS ---
  const [formData, setFormData] = useState({
    rol_id: '', area_id: '', nombre_completo: '', correo: '', password_hash: '123456'
  })

  const [formContratista, setFormContratista] = useState({ razon_social: '', rut: '' })
  const [formArea, setFormArea] = useState({ nombre: '', contratista_id: '' })

  const limpiarFormularios = () => {
    setFormData({ rol_id: '', area_id: '', nombre_completo: '', correo: '', password_hash: '123456' })
    setFormContratista({ razon_social: '', rut: '' })
    setFormArea({ nombre: '', contratista_id: '' })
    setEditandoId(null)
  }

  // ---  MANEJADORES DE ENVÍO ---
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
      if (response.ok) { limpiarFormularios(); cargarUsuarios(); }
    } catch { alert('Error al guardar usuario') }
  }

  const handleSubmitContratista = async (e) => {
    e.preventDefault()
    try {
      const method = editandoId ? 'PUT' : 'POST'
      const url = editandoId ? `${API_URL}/api/contratistas/${editandoId}` : `${API_URL}/api/contratistas`
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formContratista)
      })
      if (response.ok) { limpiarFormularios(); cargarContratistas(); }
    } catch { alert('Error al guardar contratista') }
  }

  const handleSubmitArea = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch(`${API_URL}/api/areas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: formArea.nombre,
          contratista_id: Number(formArea.contratista_id)
        })
      })
      if (response.ok) { setFormArea({ nombre: '', contratista_id: '' }); cargarAreas(); }
    } catch { alert('Error al guardar área') }
  }

  const eliminarContratista = async (id) => {
    if (!window.confirm("¿Desactivar contratista?")) return
    await fetch(`${API_URL}/api/contratistas/${id}`, { method: 'DELETE' })
    cargarContratistas()
  }

  // --- FILTROS ---
  const listaUsuariosFiltrada = usuarios
    .filter(u => tabActiva === 'activos' ? u.estado_activo : !u.estado_activo)
    .filter(u => u.nombre_completo.toLowerCase().includes(busqueda.toLowerCase()))

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">GS</div>
          <div><h2>repoGPS</h2><p>Admin Panel</p></div>
        </div>
        <nav className="sidebar-nav">
          <span className="nav-title">Mantenimiento</span>
          <button 
            className={`nav-item ${seccionActual === 'usuarios' ? 'active' : ''}`}
            onClick={() => { setSeccionActual('usuarios'); limpiarFormularios(); }}
          > Usuarios </button>
          
          <button 
            className={`nav-item ${seccionActual === 'contratistas' ? 'active' : ''}`}
            onClick={() => { setSeccionActual('contratistas'); limpiarFormularios(); }}
          > Contratistas </button>

          <button 
            className={`nav-item ${seccionActual === 'areas' ? 'active' : ''}`}
            onClick={() => { setSeccionActual('areas'); limpiarFormularios(); }}
          > Áreas </button>
        </nav>
      </aside>

      <main className="content">
        <header className="content-header">
          <h1>
            {seccionActual === 'usuarios' && 'Gestión de Usuarios'}
            {seccionActual === 'contratistas' && 'Empresas Contratistas'}
            {seccionActual === 'areas' && 'Áreas de Trabajo'}
          </h1>
          <div className="search-bar">
            <input 
              type="text" 
              placeholder="Buscar..." 
              value={busqueda} 
              onChange={(e) => setBusqueda(e.target.value)} 
            />
          </div>
        </header>

        {errorBd && <div className="alert-error"><strong>Error:</strong> {errorBd}</div>}

        {seccionActual === 'usuarios' && (
          <div key="usuarios-view">
            <section className="panel">
              <div className="panel-top"><h3>{editandoId ? 'Modificar' : 'Registrar'} Usuario</h3></div>
              <form onSubmit={handleSubmitUsuario} className="form-grid">
                <div className="field">
                  <label>Nombre Completo</label>
                  <input type="text" value={formData.nombre_completo} onChange={e => setFormData({...formData, nombre_completo: e.target.value})} required />
                </div>
                <div className="field">
                  <label>Correo electrónico</label>
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
                    {areas.map(a => <option key={a.id} value={a.id}>{a.nombre} ({a.contratista_nombre})</option>)}
                  </select>
                </div>
                <div className="form-actions" style={{ gridColumn: '1 / -1' }}>
                  <button type="submit" className="btn btn-primary">{editandoId ? 'Actualizar' : 'Crear'}</button>
                  {editandoId && <button type="button" className="btn btn-secondary" onClick={limpiarFormularios}>Cancelar</button>}
                </div>
              </form>
            </section>

            <section className="panel">
              <div className="panel-top table-top">
                <div className="tabs">
                  <button className={`tab-btn ${tabActiva === 'activos' ? 'active' : ''}`} onClick={() => setTabActiva('activos')}>Activos</button>
                  <button className={`tab-btn ${tabActiva === 'inactivos' ? 'active' : ''}`} onClick={() => setTabActiva('inactivos')}>Papelera</button>
                </div>
              </div>
              <div className="table-wrap">
                <table className="users-table">
                  <thead><tr><th>Nombre</th><th>Correo</th><th>Rol</th><th>Área</th></tr></thead>
                  <tbody>
                    {listaUsuariosFiltrada.map(u => (
                      <tr key={u.id}>
                        <td>{u.nombre_completo}</td>
                        <td>{u.correo}</td>
                        <td><span className="role-tag">{u.rol_nombre}</span></td>
                        <td>{u.area_nombre}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {seccionActual === 'contratistas' && (
          <div key="contratistas-view">
            <section className="panel">
              <div className="panel-top"><h3>{editandoId ? 'Modificar' : 'Nuevo'} Contratista</h3></div>
              <form onSubmit={handleSubmitContratista} className="form-grid">
                <div className="field">
                  <label>Razón Social</label>
                  <input type="text" value={formContratista.razon_social} onChange={e => setFormContratista({...formContratista, razon_social: e.target.value})} required />
                </div>
                <div className="field">
                  <label>RUT</label>
                  <input type="text" value={formContratista.rut} onChange={e => setFormContratista({...formContratista, rut: e.target.value})} required />
                </div>
                <div className="form-actions" style={{ gridColumn: '1 / -1' }}>
                    <button type="submit" className="btn btn-primary">{editandoId ? 'Actualizar' : 'Guardar Empresa'}</button>
                    {editandoId && <button type="button" className="btn btn-secondary" onClick={limpiarFormularios}>Cancelar</button>}
                </div>
              </form>
            </section>
            <section className="panel">
              <div className="table-wrap">
                <table className="users-table">
                  <thead><tr><th>ID</th><th>Razón Social</th><th>RUT</th><th>Acciones</th></tr></thead>
                  <tbody>
                    {contratistas.map(c => (
                      <tr key={c.id}>
                        <td>{c.id}</td>
                        <td>{c.razon_social}</td>
                        <td>{c.rut}</td>
                        <td>
                          <button className="btn-mini btn-primary" style={{marginRight: '5px'}} onClick={() => {setEditandoId(c.id); setFormContratista({razon_social: c.razon_social, rut: c.rut})}}>Editar</button>
                          <button className="btn-mini btn-danger" onClick={() => eliminarContratista(c.id)}>Eliminar</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {seccionActual === 'areas' && (
          <div key="areas-view">
            <section className="panel">
              <div className="panel-top"><h3>Registrar Nueva Área</h3></div>
              <form onSubmit={handleSubmitArea} className="form-grid">
                <div className="field">
                  <label>Nombre de la Unidad/Área</label>
                  <input type="text" placeholder="Ej: Ingeniería" value={formArea.nombre} onChange={e => setFormArea({...formArea, nombre: e.target.value})} required />
                </div>
                <div className="field">
                  <label>Pertenece a Contratista</label>
                  <select value={formArea.contratista_id} onChange={e => setFormArea({...formArea, contratista_id: e.target.value})} required>
                    <option value="">Seleccione empresa...</option>
                    {contratistas.map(c => (<option key={c.id} value={c.id}>{c.razon_social}</option>))}
                  </select>
                </div>
                <div className="form-actions" style={{ gridColumn: '1 / -1' }}><button type="submit" className="btn btn-primary">Crear Área</button></div>
              </form>
            </section>
            <section className="panel">
              <div className="table-wrap">
                <table className="users-table">
                  <thead><tr><th>Área</th><th>Empresa Responsable</th><th>Estado</th></tr></thead>
                  <tbody>
                    {areas.map(a => (
                      <tr key={a.id}>
                        <td>{a.nombre}</td>
                        <td>{a.contratista_nombre}</td>
                        <td>{a.estado_activo ? 'Activo' : 'Inactivo'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  )
}

export default App