import { useState, useEffect } from 'react'

function App() {
  const [roles, setRoles] = useState([]);
  const [errorBd, setErrorBd] = useState(null);
  const [formData, setFormData] = useState({ rol_id: '', nombre_completo: '', correo: '', password_hash: '123456' });

  useEffect(() => {
    fetch('http://68.183.100.49/:3000/api/roles')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setRoles(data);
        } else {
          setErrorBd(data.error || "Error desconocido en la BD");
        }
      })
      .catch(err => {
        setErrorBd("El backend está apagado o inalcanzable");
      });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const response = await fetch('http://68.183.100.49:3000/api/usuarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    
    if (response.ok) {
      alert("¡Usuario Creado Exitosamente!");
    } else {
      const errorData = await response.json(); 
      alert("Motivo del error: " + errorData.error);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h2>Crear Usuario (HU-02)</h2>
      
      {}
      {errorBd && (
        <div style={{ background: '#ffcccc', color: 'red', padding: '10px', marginBottom: '15px' }}>
          <strong>Error de Base de Datos:</strong> {errorBd}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <input 
          placeholder="Nombre Completo" 
          onChange={(e) => setFormData({...formData, nombre_completo: e.target.value})} 
          required 
          style={{ padding: '5px', width: '250px' }}
        /><br/><br/>
        
        <input 
          type="email" 
          placeholder="Correo Electrónico" 
          onChange={(e) => setFormData({...formData, correo: e.target.value})} 
          required 
          style={{ padding: '5px', width: '250px' }}
        /><br/><br/>
        
        <select 
          onChange={(e) => setFormData({...formData, rol_id: e.target.value})} 
          required
          style={{ padding: '5px', width: '265px' }}
        >
          <option value="">Seleccione un Rol...</option>
          {}
          {Array.isArray(roles) && roles.map(rol => (
            <option key={rol.id} value={rol.id}>{rol.nombre}</option>
          ))}
        </select><br/><br/>
        
        <button type="submit" style={{ padding: '8px 15px', cursor: 'pointer' }}>Guardar Usuario</button>
      </form>
    </div>
  )
}

export default App;