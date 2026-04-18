import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import Login from './Login.jsx'

function Root() {
  const [usuario, setUsuario] = useState(() => {
    const guardado = localStorage.getItem('usuario')
    return guardado ? JSON.parse(guardado) : null
  })

  const handleLogout = () => {
    localStorage.removeItem('usuario')
    setUsuario(null)
  }

  return usuario ? (
    <App onLogout={handleLogout} />
  ) : (
    <Login onLogin={setUsuario} />
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>
)