import { useState } from 'react'
import { useAuth } from './context/useAuth'
import Sidebar from './components/layout/Sidebar'
import Content from './components/layout/Content'
import Dashboard from './components/dashboard/Dashboard'
import UsuariosPanel from './components/mantenedores/Usuarios'
import ContratistasPanel from './components/mantenedores/Contratistas'
import AreasPanel from './components/mantenedores/Áreas'
import DisciplinasPanel from './components/mantenedores/Disciplinas'
import CategoriasPanel from './components/mantenedores/Categorias'
import ProcesosPanel from './components/procesos/Procesos'
import EtapasPanel from './components/procesos/Etapas'
import ExpedientesPanel from './components/expedientes/Expedientes'
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
  categorias: 'Categorías',
  procesos: 'Procesos',
  etapas: 'Etapas',
  expedientes: 'Expedientes'
}

// Menús por rol
const menuAdmin = ['dashboard', 'usuarios', 'contratistas', 'areas', 'disciplinas', 'categorias', 'procesos', 'etapas', 'expedientes']
const menuNoAdmin = ['dashboard', 'bandeja', 'expedientes']

const AppContent = () => {
  const { user, logout, loading } = useAuth()
  const [seccionActual, setSeccionActual] = useState('dashboard')

  // Calcular menú según rol (sin useEffect)
  const menuItems = esAdmin(user) ? menuAdmin : menuNoAdmin

  const handleLogout = () => {
    logout()
  }

  const renderPanel = () => {
    switch (seccionActual) {
      case 'dashboard':
        return <Dashboard user={user} esAdmin={esAdmin(user)} />
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
      case 'categorias':
        return <CategoriasPanel />
      case 'procesos':
        return <ProcesosPanel />
      case 'etapas':
        return <EtapasPanel />
      case 'expedientes':
        return <ExpedientesPanel user={user} />
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
      <Content titulo={titulos[seccionActual]}>
        {renderPanel()}
      </Content>
    </div>
  )
}

const App = () => {
  return <AppContent />
}

export default App
