import { useState, useEffect } from 'react'
import { useCategorias } from '../../hooks/useCategorias'

const CategoriasPanel = () => {
  const {
    categorias,
    subtipos,
    cargarCategorias,
    cargarSubtipos,
    crearCategoria,
    actualizarCategoria,
    cambiarEstadoCategoria,
    crearSubtipo,
    actualizarSubtipo,
    cambiarEstadoSubtipo
  } = useCategorias()

  // Estados para categorías
  const [formCategoria, setFormCategoria] = useState({ nombre: '', descripcion: '' })
  const [editandoCategoriaId, setEditandoCategoriaId] = useState(null)
  const [tabCategorias, setTabCategorias] = useState('activos')
  const [busquedaCategoria, setBusquedaCategoria] = useState('')

  // Estados para subtipos
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null)
  const [formSubtipo, setFormSubtipo] = useState({ nombre: '', descripcion: '' })
  const [editandoSubtipoId, setEditandoSubtipoId] = useState(null)
  const [tabSubtipos, setTabSubtipos] = useState('activos')
  const [busquedaSubtipo, setBusquedaSubtipo] = useState('')

  // Cargar datos iniciales
  useEffect(() => {
    cargarCategorias()
    cargarSubtipos()
  }, [cargarCategorias, cargarSubtipos])

  // Cargar subtipos cuando cambia la categoría seleccionada
  useEffect(() => {
    if (categoriaSeleccionada) {
      cargarSubtipos(categoriaSeleccionada)
    }
  }, [categoriaSeleccionada, cargarSubtipos])

  // Limpiar búsquedas al cambiar de tab
  useEffect(() => {
    setBusquedaCategoria('')
    setBusquedaSubtipo('')
  }, [tabCategorias, tabSubtipos])

  // ============================================
  // HANDLERS CATEGORÍAS
  // ============================================

  const limpiarFormCategoria = () => {
    setFormCategoria({ nombre: '', descripcion: '' })
    setEditandoCategoriaId(null)
  }

  const handleSubmitCategoria = async (e) => {
    e.preventDefault()
    try {
      if (editandoCategoriaId) {
        await actualizarCategoria(editandoCategoriaId, formCategoria)
      } else {
        await crearCategoria(formCategoria)
      }
      limpiarFormCategoria()
      cargarCategorias()
    } catch (err) {
      alert(err.message)
    }
  }

  const handleEditarCategoria = (cat) => {
    setFormCategoria({
      nombre: cat.nombre,
      descripcion: cat.descripcion || ''
    })
    setEditandoCategoriaId(cat.id)
  }

  const handleCambiarEstadoCategoria = async (id, nuevoEstado) => {
    try {
      await cambiarEstadoCategoria(id, nuevoEstado)
      await cargarCategorias()
      // Si la categoría se desactivó, también recargar subtipos
      if (categoriaSeleccionada && !nuevoEstado) {
        await cargarSubtipos(categoriaSeleccionada)
      }
    } catch (err) {
      alert(err.message)
    }
  }

  const filtrarCategorias = (lista) => {
    return lista
      .filter(item => tabCategorias === 'activos' ? item.estado_activo : !item.estado_activo)
      .filter(item => {
        const s = busquedaCategoria.toLowerCase()
        return item.nombre?.toLowerCase().includes(s) || 
               item.descripcion?.toLowerCase().includes(s)
      })
  }

  // ============================================
  // HANDLERS SUBTIPOS
  // ============================================

  const limpiarFormSubtipo = () => {
    setFormSubtipo({ nombre: '', descripcion: '' })
    setEditandoSubtipoId(null)
  }

  const handleSubmitSubtipo = async (e) => {
    e.preventDefault()
    if (!categoriaSeleccionada) {
      alert('Seleccione una categoría primero')
      return
    }
    try {
      if (editandoSubtipoId) {
        await actualizarSubtipo(editandoSubtipoId, {
          ...formSubtipo,
          categoria_id: categoriaSeleccionada
        })
      } else {
        await crearSubtipo({
          ...formSubtipo,
          categoria_id: categoriaSeleccionada
        })
      }
      limpiarFormSubtipo()
      cargarSubtipos(categoriaSeleccionada)
    } catch (err) {
      alert(err.message)
    }
  }

  const handleEditarSubtipo = (sub) => {
    setFormSubtipo({
      nombre: sub.nombre,
      descripcion: sub.descripcion || ''
    })
    setEditandoSubtipoId(sub.id)
  }

  const handleCambiarEstadoSubtipo = async (id, nuevoEstado) => {
    try {
      await cambiarEstadoSubtipo(id, nuevoEstado)
      await cargarSubtipos(categoriaSeleccionada)
    } catch (err) {
      alert(err.message)
    }
  }

  const filtrarSubtipos = (lista) => {
    return lista
      .filter(item => tabSubtipos === 'activos' ? item.estado_activo : !item.estado_activo)
      .filter(item => {
        const s = busquedaSubtipo.toLowerCase()
        return item.nombre?.toLowerCase().includes(s) || 
               item.descripcion?.toLowerCase().includes(s)
      })
  }

  const getTituloCategoria = () => editandoCategoriaId ? 'Modificar' : 'Registrar'
  const getTituloSubtipo = () => editandoSubtipoId ? 'Modificar' : 'Registrar'

  return (
    <>
      {/* Panel de Categorías */}
      <section className="panel">
        <div className="panel-top">
          <h3>{getTituloCategoria()} Categoría</h3>
        </div>
        <form onSubmit={handleSubmitCategoria} className="form-grid">
          <div className="field">
            <label>Nombre de la Categoría</label>
            <input
              type="text"
              value={formCategoria.nombre}
              onChange={e => setFormCategoria({ ...formCategoria, nombre: e.target.value })}
              required
            />
          </div>
          <div className="field">
            <label>Descripción</label>
            <input
              type="text"
              value={formCategoria.descripcion}
              onChange={e => setFormCategoria({ ...formCategoria, descripcion: e.target.value })}
            />
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              {editandoCategoriaId ? 'Actualizar' : 'Crear'}
            </button>
            {editandoCategoriaId && (
              <button type="button" className="btn btn-secondary" onClick={limpiarFormCategoria}>
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
              className={`tab-btn ${tabCategorias === 'activos' ? 'active' : ''}`} 
              onClick={() => setTabCategorias('activos')}
            >
              Activos
            </button>
            <button 
              className={`tab-btn ${tabCategorias === 'inactivos' ? 'active' : ''}`} 
              onClick={() => setTabCategorias('inactivos')}
            >
              Inactivos
            </button>
          </div>
          <div className="category-hint">💡 Click en una categoría para ver sus subtipos</div>
          <div className="table-controls">
            <div className="search-wrapper">
              <span className="search-icon">🔍</span>
              <input 
                type="text" 
                className="search-input"
                placeholder="Buscar categoría..." 
                value={busquedaCategoria} 
                onChange={e => setBusquedaCategoria(e.target.value)} 
              />
            </div>
          </div>
        </div>
        <div className="table-wrap">
          <table className="users-table">
            <thead>
              <tr>
                <th>Categoría</th>
                <th>Descripción</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtrarCategorias(categorias).map(cat => (
                <tr 
                  key={cat.id} 
                  className={categoriaSeleccionada === cat.id ? 'selected-row' : ''}
                  onClick={() => setCategoriaSeleccionada(cat.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <td>{cat.nombre}</td>
                  <td>{cat.descripcion || '-'}</td>
                  <td>
                    <button 
                      className="btn-mini btn-edit" 
                      onClick={(e) => { e.stopPropagation(); handleEditarCategoria(cat); }}
                    >
                      Editar
                    </button>
                    <button 
                      className="btn-mini btn-danger" 
                      onClick={(e) => { e.stopPropagation(); handleCambiarEstadoCategoria(cat.id, !cat.estado_activo); }}
                    >
                      {cat.estado_activo ? 'Borrar' : 'Reactivar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Panel de Subtipos - Solo visible cuando hay una categoría seleccionada */}
      {categoriaSeleccionada && (
        <>
          <section className="panel">
            <div className="panel-top">
              <h3>{getTituloSubtipo()} Subtipo</h3>
              <span className="category-badge">
                Categoría: {categorias.find(c => c.id === categoriaSeleccionada)?.nombre}
              </span>
            </div>
            <form onSubmit={handleSubmitSubtipo} className="form-grid">
              <div className="field">
                <label>Nombre del Subtipo</label>
                <input
                  type="text"
                  value={formSubtipo.nombre}
                  onChange={e => setFormSubtipo({ ...formSubtipo, nombre: e.target.value })}
                  required
                />
              </div>
              <div className="field">
                <label>Descripción</label>
                <input
                  type="text"
                  value={formSubtipo.descripcion}
                  onChange={e => setFormSubtipo({ ...formSubtipo, descripcion: e.target.value })}
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  {editandoSubtipoId ? 'Actualizar' : 'Crear'}
                </button>
                {editandoSubtipoId && (
                  <button type="button" className="btn btn-secondary" onClick={limpiarFormSubtipo}>
                    Cancelar
                  </button>
                )}
                <button 
                  type="button" 
                  className="btn btn-outline" 
                  onClick={() => { setCategoriaSeleccionada(null); limpiarFormSubtipo(); }}
                >
                  Cerrar
                </button>
              </div>
            </form>
          </section>

          <section className="panel">
            <div className="panel-top table-top">
              <div className="tabs">
                <button 
                  className={`tab-btn ${tabSubtipos === 'activos' ? 'active' : ''}`} 
                  onClick={() => setTabSubtipos('activos')}
                >
                  Activos
                </button>
                <button 
                  className={`tab-btn ${tabSubtipos === 'inactivos' ? 'active' : ''}`} 
                  onClick={() => setTabSubtipos('inactivos')}
                >
                  Inactivos
                </button>
              </div>
              <div className="table-controls">
                <div className="search-wrapper">
                  <span className="search-icon">🔍</span>
                  <input 
                    type="text" 
                    className="search-input"
                    placeholder="Buscar subtipo..." 
                    value={busquedaSubtipo} 
                    onChange={e => setBusquedaSubtipo(e.target.value)} 
                  />
                </div>
              </div>
            </div>
            <div className="table-wrap">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>Subtipo</th>
                    <th>Descripción</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrarSubtipos(subtipos).map(sub => (
                    <tr key={sub.id}>
                      <td>{sub.nombre}</td>
                      <td>{sub.descripcion || '-'}</td>
                      <td>
                        <button className="btn-mini btn-edit" onClick={() => handleEditarSubtipo(sub)}>
                          Editar
                        </button>
                        <button 
                          className="btn-mini btn-danger" 
                          onClick={() => handleCambiarEstadoSubtipo(sub.id, !sub.estado_activo)}
                        >
                          {sub.estado_activo ? 'Borrar' : 'Reactivar'}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filtrarSubtipos(subtipos).length === 0 && (
                    <tr>
                      <td colSpan="3" style={{ textAlign: 'center', color: '#888' }}>
                        No hay subtipos para esta categoría
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </>
  )
}

export default CategoriasPanel