import { useEffect } from 'react'
import { useExpedientes } from '../../hooks/useExpedientes'

const Dashboard = ({ user, esAdmin = true, onSelectEstado }) => {
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
    enCurso: 0,
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
        stats.enCurso++
      }
    } else {
      // Pendiente o sin asignar
      stats.pendiente++
    }
  })

  const handleClick = (estado) => {
    if (onSelectEstado) onSelectEstado(estado)
  }

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
        <button type="button" className="dashboard-card" style={{ borderLeftColor: '#3b82f6' }} onClick={() => handleClick('En Revision')}>
          <div className="dashboard-value" style={{ color: '#3b82f6' }}>{stats.enCurso}</div>
          <div className="dashboard-label">En Curso</div>
        </button>
        <button type="button" className="dashboard-card" style={{ borderLeftColor: '#ef4444' }} onClick={() => handleClick('En Revision')}>
          <div className="dashboard-value" style={{ color: '#ef4444' }}>{stats.atrasado}</div>
          <div className="dashboard-label">Atrasado</div>
        </button>
        <button type="button" className="dashboard-card" style={{ borderLeftColor: '#22c55e' }} onClick={() => handleClick('Aprobado')}>
          <div className="dashboard-value" style={{ color: '#22c55e' }}>{stats.terminado}</div>
          <div className="dashboard-label">Terminado</div>
        </button>
      </div>
    </div>
  )
}

export default Dashboard
