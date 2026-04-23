import { useAuth } from '../../context/AuthContext'

const BandejaTareas = ({ user }) => {
  const { user: authUser } = useAuth()
  const usuario = user || authUser

  return (
    <div className="bandeja-tareas">
      <h2 style={{ marginBottom: '24px', color: 'var(--text-main)' }}>
        Bandeja de Tareas
      </h2>
      
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: '8px',
        padding: '40px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
          </svg>
        </div>
        <h3 style={{ marginBottom: '12px', color: 'var(--text-main)' }}>
          Vista en Desarrollo
        </h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>
          Aquí verás las tareas asignadas a tu rol de <strong>{usuario?.rol_nombre}</strong>
        </p>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
          Área: {usuario?.area_nombre || 'No asignada'}
        </p>
      </div>

      <div style={{ marginTop: '24px' }}>
        <h4 style={{ marginBottom: '16px', color: 'var(--text-main)' }}>
          Próximas funcionalidades:
        </h4>
        <ul style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          padding: '20px 40px'
        }}>
          <li style={{ marginBottom: '8px', color: 'var(--text-secondary)' }}>
            Ver expedientes que requieren tu atención
          </li>
          <li style={{ marginBottom: '8px', color: 'var(--text-secondary)' }}>
            Acciones de Aprobar/Rechazar/Revisar
          </li>
          <li style={{ marginBottom: '8px', color: 'var(--text-secondary)' }}>
            Notificaciones de nuevos asignación
          </li>
          <li style={{ color: 'var(--text-secondary)' }}>
            Historial de tareas completadas
          </li>
        </ul>
      </div>
    </div>
  )
}

export default BandejaTareas