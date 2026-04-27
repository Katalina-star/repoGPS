const ExpedienteDetalle = ({
  expediente,
  historial = [],
  documentos = [],
  onCerrar,
  onAvanzar,
  onDevolver
}) => {

  const handleAvanzar = async () => {
    const observacion = prompt('Observación (opcional):')
    if (observacion !== null) {
      try {
        await onAvanzar(expediente.id, observacion)
        onCerrar()
      } catch (err) {
        alert(err.message)
      }
    }
  }

  const handleDevolver = async () => {
    const observacion = prompt('Observación (opcional):')
    if (observacion !== null) {
      try {
        await onDevolver(expediente.id, observacion)
        onCerrar()
      } catch (err) {
        alert(err.message)
      }
    }
  }

  if (!expediente) return null

  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Expediente #{expediente.id}</h2>
          <button className="btn-close" onClick={onCerrar}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="exp-info">
            <p><strong>Título:</strong> {expediente.titulo}</p>
            <p><strong>Proceso:</strong> {expediente.proceso_nombre}</p>
            <p><strong>Etapa Actual:</strong> <span className="role-tag">{expediente.etapa_actual}</span></p>
            <p><strong>Descripción:</strong> {expediente.descripcion || 'Sin descripción'}</p>
            <p><strong>Fecha Creación:</strong> {new Date(expediente.fecha_creacion).toLocaleString()}</p>
          </div>

          <div className="exp-actions">
            <button className="btn btn-primary" onClick={handleAvanzar}>▶ Avanzar</button>
            <button className="btn btn-secondary" onClick={handleDevolver}>◀ Devolver</button>
          </div>

          <div className="exp-section">
            <h4>📋 Historial</h4>
            {historial.length > 0 ? (
              <table className="users-table">
                <thead><tr><th>Fecha</th><th>De</th><th>A</th><th>Usuario</th><th>Observación</th></tr></thead>
                <tbody>
                  {historial.map(h => (
                    <tr key={h.id}>
                      <td>{new Date(h.fecha_cambio).toLocaleString()}</td>
                      <td>{h.etapa_anterior_nombre || '-'}</td>
                      <td>{h.etapa_nueva_nombre || '-'}</td>
                      <td>{h.usuario_nombre || '-'}</td>
                      <td>{h.observacion || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <p className="empty-text">Sin cambios de etapa registrados</p>}
          </div>

          <div className="exp-section">
            <h4>📎 Documentos</h4>
            {documentos.length > 0 ? (
              <table className="users-table">
                <thead><tr><th>Nombre</th><th>Tipo</th><th>Tamaño</th><th>Fecha</th></tr></thead>
                <tbody>
                  {documentos.map(d => (
                    <tr key={d.id}>
                      <td>{d.nombre_archivo}</td>
                      <td>{d.tipo_mime}</td>
                      <td>{(d.tamano_bytes / 1024).toFixed(1)} KB</td>
                      <td>{new Date(d.fecha_upload).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <p className="empty-text">Sin documentos adjuntos</p>}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ExpedienteDetalle
