import { useState, useEffect } from 'react'

function App() {
  const [roles, setRoles] = useState([]);
  const [formData, setFormData] = useState({ rol_id: '', nombre_completo: '', correo: '', password_hash: '123456' });

  useEffect(() => {
    fetch('http://localhost:3000/api/roles')
      .then(res => res.json())
      .then(data => setRoles(data));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const response = await fetch('http://localhost:3000/api/usuarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    if (response.ok) alert("Usuario Creado Exitosamente!");
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Crear Usuario (HU-02)</h2>
      <form onSubmit={handleSubmit}>
        <input 
          placeholder="Nombre Completo" 
          onChange={(e) => setFormData({...formData, nombre_completo: e.target.value})} 
          required 
        /><br/><br/>
        <input 
          type="email" 
          placeholder="Correo Electrónico" 
          onChange={(e) => setFormData({...formData, correo: e.target.value})} 
          required 
        /><br/><br/>
        <select onChange={(e) => setFormData({...formData, rol_id: e.target.value})} required>
          <option value="">Seleccione un Rol...</option>
          {roles.map(rol => (
            <option key={rol.id} value={rol.id}>{rol.nombre}</option>
          ))}
        </select><br/><br/>
        <button type="submit">Guardar Usuario</button>
      </form>
    </div>
  )
}

export default App;