const Sidebar = ({ seccionActual, onCambiarSeccion, onLogout }) => {
  const secciones = [
    { id: 'dashboard', label: 'Dashboard', categoria: 'Gestion' },
    { id: 'usuarios', label: 'Usuarios', categoria: 'Gestion' },
    { id: 'contratistas', label: 'Contratistas', categoria: 'Gestion' },
    { id: 'areas', label: 'Áreas', categoria: 'Gestion' },
    { id: 'disciplinas', label: 'Disciplinas', categoria: 'Gestion' },
    { id: 'procesos', label: 'Procesos', categoria: 'Motor de Procesos' },
    { id: 'etapas', label: 'Etapas', categoria: 'Motor de Procesos' },
    { id: 'expedientes', label: 'Expedientes', categoria: 'Expedientes' }
  ]

  const seccionesPorCategoria = {
    'Gestion': ['dashboard', 'usuarios', 'contratistas', 'areas', 'disciplinas'],
    'Motor de Procesos': ['procesos', 'etapas'],
    'Expedientes': ['expedientes']
  }

  const getSeccionById = (id) => secciones.find(s => s.id === id)

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">GS</div>
        <div>
          <h2>repoGPS</h2>
          <p>Admin Panel</p>
        </div>
      </div>

      <nav className="sidebar-nav">
        {Object.entries(seccionesPorCategoria).map(([categoria, secIds]) => (
          <div key={categoria} className="nav-categoria">
            <span className="nav-title">{categoria}</span>
            {secIds.map(id => {
              const sec = getSeccionById(id)
              return (
                <button
                  key={sec.id}
                  className={`nav-item ${seccionActual === sec.id ? 'active' : ''}`}
                  onClick={() => onCambiarSeccion(sec.id)}
                >
                  {sec.label}
                </button>
              )
            })}
          </div>
        ))}
      </nav>

      <div className="sidebar-logout">
        <button className="logout-btn" onClick={onLogout}>Cerrar sesión</button>
      </div>
    </aside>
  )
}

export default Sidebar