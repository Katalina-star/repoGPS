const Sidebar = ({ seccionActual, onCambiarSeccion, onLogout, menuItems = [], titulos = {}, usuario = {} }) => {
  // Categorías para el menú admin
  const categoriasAdmin = {
    'Gestion': ['dashboard', 'usuarios', 'contratistas', 'areas', 'disciplinas'],
    'Motor de Procesos': ['procesos', 'etapas'],
    'Expedientes': ['expedientes']
  }

  // Categorías para el menú no-admin
  const categoriasNoAdmin = {
    'Mi Area': ['dashboard', 'bandeja', 'expedientes']
  }

  // Usar categorías según el rol
  const esAdmin = usuario?.rol_id === 1
  const seccionesPorCategoria = esAdmin ? categoriasAdmin : categoriasNoAdmin

  // Filtrar categorías según menuItems permitidos
  const filteredCategorias = Object.entries(seccionesPorCategoria).reduce((acc, [categoria, items]) => {
    const filtered = items.filter(id => menuItems.includes(id))
    if (filtered.length > 0) {
      acc[categoria] = filtered
    }
    return acc
  }, {})

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">GS</div>
        <div>
          <h2>repoGPS</h2>
          <p>{esAdmin ? 'Admin Panel' : usuario.rol_nombre || 'Usuario'}</p>
        </div>
      </div>

      <nav className="sidebar-nav">
        {Object.entries(filteredCategorias).map(([categoria, items]) => (
          <div key={categoria} className="nav-categoria">
            <span className="nav-title">{categoria}</span>
            {items.map(id => (
              <button
                key={id}
                className={`nav-item ${seccionActual === id ? 'active' : ''}`}
                onClick={() => onCambiarSeccion(id)}
              >
                {titulos[id] || id}
              </button>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <span className="user-name">{usuario.nombre_completo}</span>
          <span className="user-role">{usuario.rol_nombre}</span>
        </div>
        <button className="logout-btn" onClick={onLogout}>Cerrar sesión</button>
      </div>
    </aside>
  )
}

export default Sidebar