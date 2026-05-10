import { useEffect } from 'react'
import { useExpedientes } from '../../hooks/useExpedientes'

const Dashboard = ({ user, esAdmin = true, onSelectFiltro }) => {
  const { expedientes, cargarExpedientes } = useExpedientes()

  useEffect(() => {
    cargarExpedientes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const ahora = new Date()

  // Filtrar expedientes según rol
  const expedientesFiltrados = esAdmin
    ? expedientes
    : expedientes.filter(exp => exp.area_id === user?.area_id)

  const stats = {
    total: expedientesFiltrados.length,
    pendiente: 0,
    enPlazo: 0,
    atrasado: 0,
    terminado: 0
  }

  // Usar el campo 'estado' del backend: Pendiente, En Revision, Aprobado
  expedientesFiltrados.forEach(exp => {
    const fechaExp = exp.fecha_actualizacion || exp.fecha_creacion
    const diasTranscurridos = Math.floor((ahora - new Date(fechaExp)) / (1000 * 60 * 60 * 24))
    
    if (exp.estado === 'Aprobado') {
      stats.terminado++
    } else if (exp.estado === 'En Revision') {
      // Atrasado: más de 10 días en revisión
      if (diasTranscurridos > 10) {
        stats.atrasado++
      } else {
        stats.enPlazo++
      }
    } else {
      // Pendiente o sin asignar
      stats.pendiente++
    }
  })

  const handleClick = (estado, sla = 'todos') => {
    if (onSelectFiltro) onSelectFiltro({ estado, sla })
  }

  const enRevisionTotal = stats.enPlazo + stats.atrasado

  return (
    <div className="dashboard">
      <h2 style={{ marginBottom: '24px', color: 'var(--text-main)' }}>
        Dashboard {esAdmin ? '' : ` - ${user?.area_nombre || 'Mi Area'}`}
      </h2>
      
      <div className="dashboard-grid">
        <button type="button" className="dashboard-card" style={{ borderLeftColor: '#64748b' }} onClick={() => handleClick('todos')}>
          <div className="dashboard-value" style={{ color: '#64748b' }}>{stats.total}</div>
          <div className="dashboard-label">Total</div>
        </button>
        <button type="button" className="dashboard-card" style={{ borderLeftColor: '#94a3b8' }} onClick={() => handleClick('Pendiente')}>
          <div className="dashboard-value" style={{ color: '#94a3b8' }}>{stats.pendiente}</div>
          <div className="dashboard-label">Pendiente</div>
        </button>
        <div className="dashboard-card" style={{ borderLeftColor: '#3b82f6' }}>
          <button type="button" className="dashboard-card-inner" onClick={() => handleClick('En Revision', 'todos')}>
            <div className="dashboard-value" style={{ color: '#3b82f6' }}>{enRevisionTotal}</div>
            <div className="dashboard-label">En Revisión</div>
          </button>
          <div className="dashboard-substats">
            <button type="button" className="dashboard-chip chip-ok" onClick={() => handleClick('En Revision', 'en_plazo')}>
              En plazo: {stats.enPlazo}
            </button>
            <button type="button" className="dashboard-chip chip-warn" onClick={() => handleClick('En Revision', 'atrasado')}>
              Atrasado: {stats.atrasado}
            </button>
          </div>
        </div>
        <button type="button" className="dashboard-card" style={{ borderLeftColor: '#22c55e' }} onClick={() => handleClick('Aprobado')}>
          <div className="dashboard-value" style={{ color: '#22c55e' }}>{stats.terminado}</div>
          <div className="dashboard-label">Terminado</div>
        </button>
      </div>
    </div>
  )
}

export default Dashboard
