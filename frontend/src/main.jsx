import { StrictMode, useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { AuthProvider, useAuth } from './context/AuthContext'
import App from './App.jsx'
import Login from './Login.jsx'

function Root() {
  const { user, logout, loading } = useAuth()
  const [appKey, setAppKey] = useState(0)

  // Force re-render cuando cambia el usuario
  const handleLogin = (usuario) => {
    setAppKey(prev => prev + 1)
  }

  // Cuando el usuario hace logout, forzar re-render
  useEffect(() => {
    if (!user) {
      setAppKey(prev => prev + 1)
    }
  }, [user])

  if (loading) {
    return <div className="loading">Cargando...</div>
  }

  return user ? (
    <App key={appKey} />
  ) : (
    <Login onLogin={handleLogin} />
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <Root />
    </AuthProvider>
  </StrictMode>
)

export default Root