import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useExpedientes } from '../../hooks/useExpedientes'
import { useApi } from '../../hooks/useApi'

const Dashboard = ({ esAdmin = true }) => {
  const { user } = useAuth()
  const { expedientes, cargarExpedientes } = useExpedientes()
  const { get } = useApi()
  const [etapasFinales, setEtapasFinales] = useState([])

  useEffect(() => {
    const cargar = async () => {
      await cargarExpedientes()
      try {
        const data = await get('/api/etapas-proceso')
        if (Array.isArray(data)) {
          setEtapasFinales(data.filter(e => e.es_final).map(e => e.nombre.toLowerCase()))
        }
      } catch (err) {
        console.error('Error al cargar etapas:', err)
      }
    }
    cargar()
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

  expedientesFiltrados.forEach(exp => {
    const etapa = (exp.etapa_actual || '').toLowerCase()
    
    // Terminado: etapa es final
    if (etapasFinales.some(ef => etapa.includes(ef))) {
      stats.terminado++
      return
    }

    // Atrasado: +10 días sin cambios Y ya fue iniciado
    const fechaExp = exp.fecha_actualizacion || exp.fecha_creacion
    const diasTranscurridos = Math.floor((ahora - new Date(fechaExp)) / (1000 * 60 * 60 * 24))
    if (diasTranscurridos > 10 && etapa !== 'pendiente' && etapa !== '') {
      stats.atrasado++
      return
    }

    // En Curso: etapa asignada y no es Pendiente
    if (etapa && !etapa.includes('pendiente')) {
      stats.enCurso++
      return
    }

    // Pendiente: sin iniciar o Pendiente
    stats.pendiente++
  })

  return (
    <div className="dashboard">
      <h2 style={{ marginBottom: '24px', color: 'var(--text-main)' }}>
        Dashboard {esAdmin ? '' : ` - ${user?.area_nombre || 'Mi Area'}`}
      </h2>
      
      <div className="dashboard-grid">
        <div className="dashboard-card" style={{ borderLeftColor: '#64748b' }}>
          <div className="dashboard-value" style={{ color: '#64748b' }}>{stats.total}</div>
          <div className="dashboard-label">Total</div>
        </div>
        <div className="dashboard-card" style={{ borderLeftColor: '#94a3b8' }}>
          <div className="dashboard-value" style={{ color: '#94a3b8' }}>{stats.pendiente}</div>
          <div className="dashboard-label">Pendiente</div>
        </div>
        <div className="dashboard-card" style={{ borderLeftColor: '#3b82f6' }}>
          <div className="dashboard-value" style={{ color: '#3b82f6' }}>{stats.enCurso}</div>
          <div className="dashboard-label">En Curso</div>
        </div>
        <div className="dashboard-card" style={{ borderLeftColor: '#ef4444' }}>
          <div className="dashboard-value" style={{ color: '#ef4444' }}>{stats.atrasado}</div>
          <div className="dashboard-label">Atrasado</div>
        </div>
        <div className="dashboard-card" style={{ borderLeftColor: '#22c55e' }}>
          <div className="dashboard-value" style={{ color: '#22c55e' }}>{stats.terminado}</div>
          <div className="dashboard-label">Terminado</div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard