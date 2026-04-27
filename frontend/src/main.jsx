import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './context/useAuth'
import App from './App.jsx'
import Login from './Login.jsx'

function Root() {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="loading">Cargando...</div>
  }

  return user ? <App /> : <Login />
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <Root />
    </AuthProvider>
  </StrictMode>,
)

export default Root