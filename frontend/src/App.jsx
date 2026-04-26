import { useState, useEffect, useCallback } from 'react'
import './index.css'

function App({ onLogout }) {
  // --- ESTADOS ---
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

  // Formularios
  const [formData, setFormData] = useState({
    rol_id: '', area_id: '', nombre_completo: '', correo: '', password_hash: '123456'
  })
  const [formContratista, setFormContratista] = useState({ razon_social: '', rut: '' })
  const [errorRut, setErrorRut] = useState('')
  const [formArea, setFormArea] = useState({ nombre: '', contratista_id: '' })
  const [formDisciplina, setFormDisciplina] = useState({ nombre: '', area_id: '', contratista_id: '' })

  const API_URL = import.meta.env.VITE_API_URL || ''

  // --- FUNCIONES DE CARGA ---
  const cargarRoles = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/roles`)
      const data = await res.json()
      if (Array.isArray(data)) setRoles(data)
    } catch { setErrorBd('Error al conectar con roles') }
  }, [API_URL])

  const cargarAreas = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/areas`)
      const data = await res.json()
      if (Array.isArray(data)) setAreas(data)
    } catch { console.error('Error al cargar áreas') }
  }, [API_URL])

  const cargarUsuarios = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/usuarios`)
      const data = await res.json()
      if (Array.isArray(data)) {
        setUsuarios(data)
        setErrorBd(null)
      } else {
        setErrorBd(data.error || 'Error al cargar usuarios')
      }
    } catch { setErrorBd('El backend de usuarios está inalcanzable') }
  }, [API_URL])

  const cargarContratistas = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/contratistas`)
      const data = await res.json()
      if (Array.isArray(data)) setContratistas(data)
    } catch { console.error('Error al cargar contratistas') }
  }, [API_URL])

  const cargarDisciplinas = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/disciplinas`)
      const data = await res.json()
      if (Array.isArray(data)) setDisciplinas(data)
    } catch { console.error('Error al cargar disciplinas') }
  }, [API_URL])

  useEffect(() => {
    const inicializar = async () => {
      await Promise.all([cargarRoles(), cargarAreas(), cargarUsuarios(), cargarContratistas(), cargarDisciplinas()])
    }
    inicializar()
  }, [cargarRoles, cargarAreas, cargarUsuarios, cargarContratistas, cargarDisciplinas])

  // --- MANEJADORES ---
  const limpiarFormularios = () => {
    setFormData({ rol_id: '', area_id: '', nombre_completo: '', correo: '', password_hash: '123456' })
    setFormContratista({ razon_social: '', rut: '' })
    setFormArea({ nombre: '', contratista_id: '' })
    setFormDisciplina({ nombre: '', area_id: '', contratista_id: '' })
    setErrorRut('')
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
      if (response.ok) { limpiarFormularios(); cargarUsuarios(); }
    } catch { alert('Error al guardar usuario') }
  }

  const handleSubmitContratista = async (e) => {
    e.preventDefault()
    setErrorRut('')
    try {
      const url = editandoId ? `${API_URL}/api/contratistas/${editandoId}` : `${API_URL}/api/contratistas`
      const method = editandoId ? 'PUT' : 'POST'
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formContratista)
      })
      if (response.ok) { 
        limpiarFormularios(); 
        cargarContratistas(); 
      } else {
        const data = await response.json()
        if (data.error && data.error.includes('RUT')) {
          setErrorRut(data.error)
        } else {
          alert('Error al guardar contratista')
        }
      }
    } catch { alert('Error al guardar contratista') }
  }

  const handleSubmitArea = async (e) => {
    e.preventDefault()
    try {
      const url = editandoId ? `${API_URL}/api/areas/${editandoId}` : `${API_URL}/api/areas`
      const method = editandoId ? 'PUT' : 'POST'
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: formArea.nombre,
          contratista_id: Number(formArea.contratista_id)
        })
      })
      if (response.ok) {
        limpiarFormularios();
        await Promise.all([cargarAreas(), cargarContratistas()]);
      } else {
        const data = await response.json().catch(() => ({}))
        alert(data.error || 'Error al guardar área')
      }
    } catch { alert('Error al guardar área') }
  }

  const handleSubmitDisciplina = async (e) => {
    e.preventDefault()
    try {
      const url = editandoId ? `${API_URL}/api/disciplinas/${editandoId}` : `${API_URL}/api/disciplinas`
      const method = editandoId ? 'PUT' : 'POST'
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: formDisciplina.nombre,
          area_id: Number(formDisciplina.area_id)
        })
      })
      if (response.ok) {
        limpiarFormularios();
        await Promise.all([cargarDisciplinas(), cargarAreas(), cargarContratistas()]);
      } else {
        const data = await response.json().catch(() => ({}))
        alert(data.error || 'Error al guardar disciplina')
      }
    } catch { alert('Error al guardar disciplina') }
  }

  const cambiarEstadoEntidad = async (path, id, nuevoEstado) => {
    const msg = nuevoEstado ? '¿Reactivar registro?' : '¿Desactivar (borrado lógico)?'
    if (!window.confirm(msg)) return
    try {
      const response = await fetch(`${API_URL}/api/${path}/${id}/estado`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado_activo: nuevoEstado })
      })
      if (response.ok) {
        cargarUsuarios(); cargarAreas(); cargarContratistas(); cargarDisciplinas();
      }
    } catch { alert('Error de conexión') }
  }

  // --- FUNCIONES DE EDICIÓN RÁPIDA ---
  const editarContratista = (c) => {
    setFormContratista({ razon_social: c.razon_social, rut: c.rut })
    setEditandoId(c.id)
  }

  const editarArea = (a) => {
    setFormArea({ nombre: a.nombre, contratista_id: String(a.contratista_id) })
    setEditandoId(a.id)
  }

  const editarDisciplina = (d) => {
    setFormDisciplina({ nombre: d.nombre, area_id: String(d.area_id), contratista_id: String(d.contratista_id || '') })
    setEditandoId(d.id)
  }

  // --- FILTROS ---
  const filtrarData = (lista) => {
    return lista
      .filter(item => tabActiva === 'activos' ? item.estado_activo : !item.estado_activo)
      .filter(item => {
        const s = busqueda.toLowerCase()
        return (
          (item.nombre_completo?.toLowerCase().includes(s)) ||
          (item.razon_social?.toLowerCase().includes(s)) ||
          (item.nombre?.toLowerCase().includes(s)) ||
          (item.correo?.toLowerCase().includes(s)) ||
          (item.area_nombre?.toLowerCase().includes(s)) ||
          (item.contratista_nombre?.toLowerCase().includes(s))
        )
      })
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
          <button className={`nav-item ${seccionActual === 'usuarios' ? 'active' : ''}`} 
            onClick={() => { setSeccionActual('usuarios'); limpiarFormularios(); }}>Usuarios</button>
          <button className={`nav-item ${seccionActual === 'contratistas' ? 'active' : ''}`} 
            onClick={() => { setSeccionActual('contratistas'); limpiarFormularios(); }}>Contratistas</button>
          <button className={`nav-item ${seccionActual === 'areas' ? 'active' : ''}`} 
            onClick={() => { setSeccionActual('areas'); limpiarFormularios(); }}>Áreas</button>
          <button className={`nav-item ${seccionActual === 'disciplinas' ? 'active' : ''}`} 
            onClick={() => { setSeccionActual('disciplinas'); limpiarFormularios(); }}>Disciplinas</button>
        </nav>

        <div className="sidebar-logout">
          <button className="logout-btn" onClick={onLogout}>Cerrar sesión</button>
        </div>
      </aside>

      <main className="content">
        <header className="content-header">
          <h1>Gestión de {seccionActual.charAt(0).toUpperCase() + seccionActual.slice(1)}</h1>
          <div className="search-box">
            <input type="text" placeholder="Buscar..." value={busqueda} onChange={e => setBusqueda(e.target.value)} />
          </div>
        </header>

        {errorBd && <div className="alert-error"><strong>Error:</strong> {errorBd}</div>}

        <section className="panel">
          <div className="panel-top">
            <h3>{editandoId ? 'Modificar' : 'Registrar'} {seccionActual}</h3>
          </div>
          
          {seccionActual === 'usuarios' && (
            <form onSubmit={handleSubmitUsuario} className="form-grid">
              <div className="field">
                <label>Nombre Completo</label>
                <input type="text" value={formData.nombre_completo} onChange={e => setFormData({...formData, nombre_completo: e.target.value})} required />
              </div>
              <div className="field">
                <label>Correo</label>
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
          )}

          {seccionActual === 'contratistas' && (
            <form onSubmit={handleSubmitContratista} className="form-grid">
              <div className="field">
                <label>Razón Social</label>
                <input type="text" value={formContratista.razon_social} onChange={e => setFormContratista({...formContratista, razon_social: e.target.value})} required />
              </div>
              <div className="field">
                <label>RUT</label>
                <input type="text" value={formContratista.rut} onChange={e => { setFormContratista({...formContratista, rut: e.target.value}); setErrorRut(''); }} required />
                {errorRut && <span style={{ color: '#e74c3c', fontSize: '12px', display: 'block', marginTop: '4px' }}>{errorRut}</span>}
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">{editandoId ? 'Actualizar' : 'Crear'}</button>
                {editandoId && <button type="button" className="btn btn-secondary" onClick={limpiarFormularios}>Cancelar</button>}
              </div>
            </form>
          )}

          {seccionActual === 'areas' && (
            <form onSubmit={handleSubmitArea} className="form-grid">
              <div className="field">
                <label>Nombre del Área</label>
                <input type="text" value={formArea.nombre} onChange={e => setFormArea({...formArea, nombre: e.target.value})} required />
              </div>
              <div className="field">
                <label>Empresa Contratista</label>
                <select value={formArea.contratista_id} onChange={e => setFormArea({...formArea, contratista_id: e.target.value})} required>
                  <option value="">Seleccione...</option>
                  {contratistas.filter(c => c.estado_activo).map(c => <option key={c.id} value={c.id}>{c.razon_social}</option>)}
                </select>
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">{editandoId ? 'Actualizar' : 'Crear'}</button>
                {editandoId && <button type="button" className="btn btn-secondary" onClick={limpiarFormularios}>Cancelar</button>}
              </div>
            </form>
          )}

          {seccionActual === 'disciplinas' && (
            <form onSubmit={handleSubmitDisciplina} className="form-grid">
              <div className="field">
                <label>Nombre de la Disciplina</label>
                <input type="text" value={formDisciplina.nombre} onChange={e => setFormDisciplina({...formDisciplina, nombre: e.target.value})} required />
              </div>
              <div className="field">
                <label>Contratista</label>
                <select 
                  value={formDisciplina.contratista_id} 
                  onChange={e => setFormDisciplina({...formDisciplina, contratista_id: e.target.value, area_id: ''})} 
                  required
                >
                  <option value="">Seleccione...</option>
                  {contratistas.filter(c => c.estado_activo).map(c => <option key={c.id} value={c.id}>{c.razon_social}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Área</label>
                <select 
                  value={formDisciplina.area_id} 
                  onChange={e => setFormDisciplina({...formDisciplina, area_id: e.target.value})} 
                  required
                  disabled={!formDisciplina.contratista_id}
                >
                  <option value="">Seleccione...</option>
                  {areas.filter(a => a.contratista_id === Number(formDisciplina.contratista_id) && a.estado_activo).map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                </select>
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">{editandoId ? 'Actualizar' : 'Crear'}</button>
                {editandoId && <button type="button" className="btn btn-secondary" onClick={limpiarFormularios}>Cancelar</button>}
              </div>
            </form>
          )}
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
                  {seccionActual === 'usuarios' && (<><th>Nombre</th><th>Correo</th><th>Rol</th><th>Área</th></>)}
                  {seccionActual === 'contratistas' && (<><th>Razón Social</th><th>RUT</th></>)}
                  {seccionActual === 'areas' && (<><th>Área</th><th>Empresa</th></>)}
                  {seccionActual === 'disciplinas' && (<><th>Disciplina</th><th>Área</th></>)}
                  <th>Acciones</th>
                </tr>
              </thead>
<tbody>
                {seccionActual === 'usuarios' && filtrarData(usuarios).map(u => (
                  <tr key={u.id}>
                    <td>{u.nombre_completo}</td><td>{u.correo}</td>
                    <td><span className="role-tag">{u.rol_nombre}</span></td>
                    <td>{u.area_nombre || 'No asignada'}</td>
                    <td>
                      <button className="btn-mini btn-edit" onClick={() => {
                        setFormData({rol_id: String(u.rol_id), area_id: String(u.area_id), nombre_completo: u.nombre_completo, correo: u.correo, password_hash: u.password_hash || '123456'});
                        setEditandoId(u.id);
                      }}>Editar</button>
                      <button className="btn-mini btn-danger" onClick={() => cambiarEstadoEntidad('usuarios', u.id, !u.estado_activo)}>{u.estado_activo ? 'Borrar' : 'Reactivar'}</button>
                    </td>
                  </tr>
                ))}

                {seccionActual === 'contratistas' && filtrarData(contratistas).map(c => (
                  <tr key={c.id}>
                    <td>{c.razon_social}</td><td>{c.rut}</td>
                    <td>
                      <button className="btn-mini btn-edit" onClick={() => editarContratista(c)}>Editar</button>
                      <button className="btn-mini btn-danger" onClick={() => cambiarEstadoEntidad('contratistas', c.id, !c.estado_activo)}>{c.estado_activo ? 'Borrar' : 'Reactivar'}</button>
                    </td>
                  </tr>
                ))}

                {seccionActual === 'areas' && filtrarData(areas).map(a => (
                  <tr key={a.id}>
                    <td>{a.nombre}</td><td>{a.contratista_nombre || 'No asignada'}</td>
                    <td>
                      <button className="btn-mini btn-edit" onClick={() => editarArea(a)}>Editar</button>
                      <button className="btn-mini btn-danger" onClick={() => cambiarEstadoEntidad('areas', a.id, !a.estado_activo)}>{a.estado_activo ? 'Borrar' : 'Reactivar'}</button>
                    </td>
                  </tr>
                ))}

                {seccionActual === 'disciplinas' && filtrarData(disciplinas).map(d => (
                  <tr key={d.id}>
                    <td>{d.nombre}</td><td>{d.area_nombre || 'No asignada'}</td>
                    <td>
                      <button className="btn-mini btn-edit" onClick={() => editarDisciplina(d)}>Editar</button>
                      <button className="btn-mini btn-danger" onClick={() => cambiarEstadoEntidad('disciplinas', d.id, !d.estado_activo)}>{d.estado_activo ? 'Borrar' : 'Reactivar'}</button>
                    </td>
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
