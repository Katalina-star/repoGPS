import { useState, useEffect } from 'react'
import { useAuth } from './context/AuthContext'
import Sidebar from './components/layout/Sidebar'
import Content from './components/layout/Content'
import Dashboard from './components/dashboard/Dashboard'
import UsuariosPanel from './components/mantenedores/Usuarios'
import ContratistasPanel from './components/mantenedores/Contratistas'
import AreasPanel from './components/mantenedores/Áreas'
import DisciplinasPanel from './components/mantenedores/Disciplinas'
import ProcesosPanel from './components/procesos/Procesos'
import EtapasPanel from './components/procesos/Etapas'
import ExpedientesPanel from './components/expedientes/Expedientes'
import ExpedienteDetalle from './components/expedientes/ExpedienteDetalle'
import BandejaTareas from './components/bandeja/BandejaTareas'

// esAdmin: rol_id === 1
const esAdmin = (user) => user?.rol_id === 1

const titulos = {
  dashboard: 'Dashboard',
  bandeja: 'Bandeja de Tareas',
  usuarios: 'Usuarios',
  contratistas: 'Contratistas',
  areas: 'Áreas',
  disciplinas: 'Disciplinas',
  procesos: 'Procesos',
  etapas: 'Etapas',
  expedientes: 'Expedientes'
}

// Menús por rol
const menuAdmin = ['dashboard', 'usuarios', 'contratistas', 'areas', 'disciplinas', 'procesos', 'etapas', 'expedientes']
const menuNoAdmin = ['dashboard', 'bandeja', 'expedientes']

const AppContent = () => {
  const { user, logout, loading } = useAuth()
  const [seccionActual, setSeccionActual] = useState('dashboard')
  const [busqueda, setBusqueda] = useState('')
  const [mostrarDetalle, setMostrarDetalle] = useState(false)
  const [expedienteDetalle, setExpedienteDetalle] = useState(null)
  const [menuItems, setMenuItems] = useState(menuAdmin)

  // Actualizar menú según rol
  useEffect(() => {
    if (user) {
      setMenuItems(esAdmin(user) ? menuAdmin : menuNoAdmin)
    }
  }, [user])

  const handleLogout = () => {
    logout()
  }

  const abrirDetalleExpediente = (exp) => {
    setExpedienteDetalle(exp)
    setMostrarDetalle(true)
  }

  const cerrarDetalleExpediente = () => {
    setMostrarDetalle(false)
    setExpedienteDetalle(null)
  }

  const renderPanel = () => {
    switch (seccionActual) {
      case 'dashboard':
        return <Dashboard esAdmin={esAdmin(user)} />
      case 'bandeja':
        return <BandejaTareas user={user} />
      case 'usuarios':
        return <UsuariosPanel />
      case 'contratistas':
        return <ContratistasPanel />
      case 'areas':
        return <AreasPanel />
      case 'disciplinas':
        return <DisciplinasPanel />
      case 'procesos':
        return <ProcesosPanel />
      case 'etapas':
        return <EtapasPanel />
      case 'expedientes':
        return <ExpedientesPanel />
      default:
        return <Dashboard esAdmin={esAdmin(user)} />
    }
  }

  if (loading) {
    return <div className="loading">Cargando...</div>
  }

  if (!user) {
    return <div className="loading">No autorizado</div>
  }

  return (
    <div className="layout">
      <Sidebar 
        seccionActual={seccionActual} 
        onCambiarSeccion={setSeccionActual} 
        onLogout={handleLogout}
        menuItems={menuItems}
        titulos={titulos}
        usuario={user}
      />
      <Content 
        titulo={titulos[seccionActual]} 
        busqueda={busqueda}
        onBuscar={setBusqueda}
      >
        {renderPanel()}
      </Content>

      {mostrarDetalle && expedienteDetalle && (
        <ExpedienteDetalle 
          expediente={expedienteDetalle} 
          onCerrar={cerrarDetalleExpediente} 
        />
      )}
    </div>
  )
}

const App = () => {
  return <AppContent />
}

export default App