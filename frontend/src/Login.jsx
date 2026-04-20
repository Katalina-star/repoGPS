import { useState } from "react";
import "./login.css";

function Login({ onLogin }) {
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [vistaNoImplementada, setVistaNoImplementada] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || "";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setVistaNoImplementada(null);

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

      // Verificar si el rol tiene acceso permitido
      if (!data.acceso_permitido) {
        setVistaNoImplementada({
          rol: data.rol_nombre,
          mensaje: data.mensaje
        });
        // Limpiar credenciales por seguridad
        setCorreo("");
        setPassword("");
        return;
      }

      localStorage.setItem("usuario", JSON.stringify(data.usuario));
      localStorage.setItem("token", data.token);
      onLogin(data.usuario);
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