import { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from './context/useAuth'
import { ThemeProvider } from './context/ThemeContext.jsx'
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
import Login from './Login.jsx'

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

// Mapeo de rutas a secciones
const rutaASeccion = {
  '/': 'dashboard',
  '/usuarios': 'usuarios',
  '/contratistas': 'contratistas',
  '/areas': 'areas',
  '/disciplinas': 'disciplinas',
  '/categorias': 'categorias',
  '/procesos': 'procesos',
  '/etapas': 'etapas',
  '/expedientes': 'expedientes',
  '/bandeja': 'bandeja'
}

const SidebarLayout = () => {
  const location = useLocation()
  const { user, logout } = useAuth()

  // Determinar sección actual basada en la ruta
  const seccionActual = rutaASeccion[location.pathname] || 'dashboard'

  const menuItems = esAdmin(user) ? menuAdmin : menuNoAdmin

  const handleLogout = () => {
    logout()
  }

  return (
    <div className="layout">
      <Sidebar
        seccionActual={seccionActual}
        onLogout={handleLogout}
        menuItems={menuItems}
        titulos={titulos}
        usuario={user}
      />
      <Content titulo={titulos[seccionActual]}>
        <Routes>
          <Route index element={<Dashboard user={user} esAdmin={esAdmin(user)} />} />
          <Route path="usuarios" element={<UsuariosPanel />} />
          <Route path="contratistas" element={<ContratistasPanel />} />
          <Route path="areas" element={<AreasPanel />} />
          <Route path="disciplinas" element={<DisciplinasPanel />} />
          <Route path="categorias" element={<CategoriasPanel />} />
          <Route path="procesos" element={<ProcesosPanel />} />
          <Route path="etapas" element={<EtapasPanel />} />
          <Route path="expedientes" element={<ExpedientesPanel user={user} />} />
          <Route path="bandeja" element={<BandejaTareas user={user} />} />
        </Routes>
      </Content>
    </div>
  )
}

// Componente que protege las rutas
const ProtectedRoute = () => {
  const { user, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login', { replace: true })
    }
  }, [user, loading, navigate])

  if (loading) {
    return <div className="loading">Cargando...</div>
  }

  if (!user) {
    return null // El efecto arriba maneja la navegación
  }

  return <SidebarLayout />
}

// Componente para la página de login
const LoginPage = () => {
  const { user, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && user) {
      navigate('/', { replace: true })
    }
  }, [user, loading, navigate])

  if (loading) {
    return <div className="loading">Cargando...</div>
  }

  return <Login />
}

const App = () => {
  return (
    <ThemeProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/*" element={<ProtectedRoute />} />
      </Routes>
    </ThemeProvider>
  )
}

export default App