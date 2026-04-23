import { useState } from "react";
import { useAuth } from "./context/AuthContext";
import "./login.css";

// === MODO DESARROLLO TEMPORAL ===
// Para testing sin backend - establecer en false para usar backend real
const MODO_DESARROLLO = true

// Usuarios de test por rol
const USERS_TEST = {
  admin: {
    id: 1,
    nombre_completo: "Admin Demo",
    correo: "admin@test.com",
    rol_id: 1,
    rol_nombre: "Administrador",
    area_id: 1,
    area_nombre: "Gerencia"
  },
  revisor: {
    id: 2,
    nombre_completo: "Revisor Demo",
    correo: "revisor@test.com",
    rol_id: 2,
    rol_nombre: "Revisor",
    area_id: 1,
    area_nombre: "Gerencia"
  },
  aprobador: {
    id: 3,
    nombre_completo: "Aprobador Demo",
    correo: "aprobador@test.com",
    rol_id: 3,
    rol_nombre: "Aprobador",
    area_id: 1,
    area_nombre: "Gerencia"
  }
}

const TOKEN_TEST = "dev-token-12345"
// ===============================

function Login() {
  const { login } = useAuth()
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [rolSeleccionado, setRolSeleccionado] = useState("admin");

  const API_URL = import.meta.env.VITE_API_URL || "";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // === MODO DESARROLLO: Login directo sin backend ===
    if (MODO_DESARROLLO) {
      login(TOKEN_TEST, USERS_TEST[rolSeleccionado])
      return
    }
    // =====================================================

    try {
      const res = await fetch(`${API_URL}/api/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ correo, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al iniciar sesión");
        return;
      }

      login(data.token, data.usuario)
    } catch {
      setError("No se pudo conectar con el servidor");
    }
  };

  return (
    <div className="login-page">
      <div className="login-shell">
        <div className="login-left">
          <div className="brand">
            <div className="brand-badge">GS</div>
            <div>
              <h1>repoGPS</h1>
              <p>Panel de acceso</p>
            </div>
          </div>

          <div className="login-copy">
            <span className="login-tag">Sistema de Gestion</span>
            <h2>Bienvenida de vuelta</h2>
            <p>
              Ingresa con tu correo y contrasena para acceder al panel
              administrativo.
            </p>
          </div>
        </div>

        <div className="login-right">
          <form className="login-card" onSubmit={handleSubmit}>
            <h3>Iniciar sesion</h3>
            <p className="login-subtitle">Accede a tu cuenta</p>

            {MODO_DESARROLLO && (
              <div style={{
                background: '#e8f5e9',
                padding: '12px',
                borderRadius: '6px',
                marginBottom: '16px',
                fontSize: '13px',
                color: '#2e7d32',
                border: '1px solid #c8e6c9'
              }}>
                <strong>Modo Desarrollo</strong>
                <div style={{ marginTop: '8px' }}>
                  <label style={{ fontSize: '12px', marginBottom: '4px', display: 'block' }}>
                    Seleccionar rol para probar:
                  </label>
                  <select
                    value={rolSeleccionado}
                    onChange={(e) => setRolSeleccionado(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '6px',
                      borderRadius: '4px',
                      border: '1px solid #c8e6c9',
                      fontSize: '13px'
                    }}
                  >
                    <option value="admin">Administrador</option>
                    <option value="revisor">Revisor</option>
                    <option value="aprobador">Aprobador</option>
                  </select>
                </div>
              </div>
            )}

            <label>Correo electronico</label>
            <input
              type="email"
              placeholder="ejemplo@correo.com"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              required
            />

            <label>Contrasena</label>
            <input
              type="password"
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {error && <p className="login-error">{error}</p>}

            <button type="submit">Entrar</button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;