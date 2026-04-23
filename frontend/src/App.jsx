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

const titulos = {
  dashboard: 'Dashboard',
  usuarios: 'Usuarios',
  contratistas: 'Contratistas',
  areas: 'Áreas',
  disciplinas: 'Disciplinas',
  procesos: 'Procesos',
  etapas: 'Etapas',
  expedientes: 'Expedientes'
}

const AppContent = () => {
  const { user, logout, loading } = useAuth()
  const [seccionActual, setSeccionActual] = useState('dashboard')
  const [busqueda, setBusqueda] = useState('')
  const [mostrarDetalle, setMostrarDetalle] = useState(false)
  const [expedienteDetalle, setExpedienteDetalle] = useState(null)

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
        return <Dashboard />
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
        return <Dashboard />
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