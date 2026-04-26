import { useEffect, useState } from "react";
import { useAuth } from "./context/AuthContext";
import "./login.css";

function Login() {
  const { login } = useAuth()
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [mensajeInfo, setMensajeInfo] = useState("");
  const [loading, setLoading] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || "";

  useEffect(() => {
    const logoutMessage = localStorage.getItem("logout_message");
    if (logoutMessage) {
      setMensajeInfo(logoutMessage);
      localStorage.removeItem("logout_message");
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMensajeInfo("");
    setLoading(true);

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
    } finally {
      setLoading(false);
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
          <form className="login-card" onSubmit={handleSubmit}>
            <h3>Iniciar sesión</h3>
            <p className="login-subtitle">Accede a tu cuenta</p>

            {mensajeInfo && (
              <p style={{
                background: '#e8f5e9',
                color: '#1b5e20',
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1px solid #c8e6c9',
                marginBottom: '12px'
              }}>
                {mensajeInfo}
              </p>
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

              <button type="submit" disabled={loading}>
                {loading ? "Ingresando..." : "Entrar"}
              </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;
