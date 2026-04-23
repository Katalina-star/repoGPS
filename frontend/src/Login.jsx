import { useState } from "react";
import { useAuth } from "./context/AuthContext";
import "./login.css";

// === MODO DESARROLLO TEMPORAL ===
// Para testing sin backend - establecer en true
const MODO_DESARROLLO = true
const USER_TEST = {
  id: 1,
  nombre_completo: "Admin Demo",
  correo: "admin@test.com",
  rol_id: 1,
  rol_nombre: "Administrador",
  area_id: 1,
  area_nombre: "Gerencia",
  contratista_id: 1,
  contratista_nombre: "Demo Empresa"
}
const TOKEN_TEST = "dev-token-12345"
// ===============================

function Login() {
  const { login } = useAuth()
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [vistaNoImplementada, setVistaNoImplementada] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || "";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setVistaNoImplementada(null);

    // === MODO DESARROLLO: Login directo sin backend ===
    if (MODO_DESARROLLO) {
      login(TOKEN_TEST, USER_TEST)
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

      if (res.status === 403 && data.rol_nombre) {
        setVistaNoImplementada({
          rol: data.rol_nombre,
          mensaje: data.mensaje
        });
        setCorreo("");
        setPassword("");
        return;
      }

      if (!res.ok) {
        setError(data.error || "Error al iniciar sesión");
        return;
      }

      if (!data.acceso_permitido) {
        setVistaNoImplementada({
          rol: data.rol_nombre,
          mensaje: data.mensaje
        });
        setCorreo("");
        setPassword("");
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
            <span className="login-tag">Sistema de Gestión</span>
            <h2>Bienvenida de vuelta</h2>
            <p>
              Ingresa con tu correo y contraseña para acceder al panel
              administrativo.
            </p>
          </div>
        </div>

        <div className="login-right">
          {vistaNoImplementada ? (
            <div className="login-card" style={{ textAlign: "center" }}>
              <div style={{ 
                fontSize: "48px", 
                marginBottom: "16px",
                color: "#f39c12"
              }}>
                🔧
              </div>
              <h3>Vista en Desarrollo</h3>
              <p style={{ color: "#7f8c8d", marginBottom: "20px" }}>
                Tu rol de <strong>{vistaNoImplementada.rol}</strong> aún no tiene
                acceso a la plataforma.
              </p>
              <p style={{ 
                background: "#fff3cd", 
                padding: "12px", 
                borderRadius: "8px",
                fontSize: "14px",
                color: "#856404"
              }}>
                {vistaNoImplementada.mensaje}
              </p>
              <button 
                type="button" 
                className="btn btn-secondary" 
                style={{ marginTop: "20px" }}
                onClick={() => setVistaNoImplementada(null)}
              >
                Intentar con otro usuario
              </button>
            </div>
          ) : (
            <form className="login-card" onSubmit={handleSubmit}>
              <h3>Iniciar sesión</h3>
              <p className="login-subtitle">Accede a tu cuenta</p>

              {MODO_DESARROLLO && (
                <div style={{
                  background: '#fff3cd',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  marginBottom: '16px',
                  fontSize: '12px',
                  color: '#856404',
                  border: '1px solid #ffc107'
                }}>
                  ⚠️ Modo desarrollo activo - clic en "Entrar" para login directo
                </div>
              )}

              <label>Correo electrónico</label>
              <input
                type="email"
                placeholder="ejemplo@correo.com"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                required
              />

              <label>Contraseña</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              {error && <p className="login-error">{error}</p>}

              <button type="submit">Entrar</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default Login;