import { useState } from 'react'
import { UploadModal } from '../upload/UploadModal'
import { DocumentTimeline } from '../upload/DocumentTimeline'

const ExpedienteDetalle = ({
  expediente,
  historial = [],
  documentos = [],
  onCerrar,
  onAvanzar,
  onDevolver,
  onActualizarFechaTermino,
  onDocumentoUploaded,
  esAdmin = false
}) => {
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showNuevaVersionModal, setShowNuevaVersionModal] = useState(false)
  const [documentoParaNuevaVersion, setDocumentoParaNuevaVersion] = useState(null)
  const [expandedDocId, setExpandedDocId] = useState(null)

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

  const handleFechaTerminoChange = async (e) => {
    const nuevaFecha = e.target.value
    if (!onActualizarFechaTermino) return
    try {
      await onActualizarFechaTermino(expediente.id, nuevaFecha || null)
    } catch (err) {
      alert(err.message)
    }
  }

  const handleUploadComplete = (newDoc) => {
    if (onDocumentoUploaded) {
      onDocumentoUploaded(newDoc)
    }
  }

  const handleDownloadDocumento = async (doc) => {
    if (doc.ruta_garage) {
      // Use the download endpoint
      const token = localStorage.getItem('token')
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL || ''}/api/documentos/${doc.id}/descargar`,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        )
        if (!response.ok) throw new Error('Error al descargar')

        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', doc.nombre_archivo)
        document.body.appendChild(link)
        link.click()
        link.parentNode.removeChild(link)
        window.URL.revokeObjectURL(url)
      } catch {
        alert('Error al descargar el documento')
      }
    }
  }

  const handleNuevaVersion = (doc) => {
    setDocumentoParaNuevaVersion(doc)
    setShowNuevaVersionModal(true)
  }

  const handleNuevaVersionComplete = (newVersionDoc) => {
    if (onDocumentoUploaded) {
      onDocumentoUploaded(newVersionDoc)
    }
    setShowNuevaVersionModal(false)
    setDocumentoParaNuevaVersion(null)
  }

  return (
    <>
      {/* Expediente Detail Modal */}
      <div className="modal-overlay" onClick={onCerrar}>
        <div className="modal-content modal-content--expediente" onClick={e => e.stopPropagation()}>
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
              <p><strong>Fecha de término:</strong> {expediente.fecha_termino ? new Date(expediente.fecha_termino).toLocaleDateString() : '-'}</p>
              {esAdmin && (
                <div style={{ marginTop: '8px' }}>
                  <label style={{ fontWeight: 600, fontSize: '0.9rem', display: 'block', marginBottom: '4px' }}>
                    Editar fecha de término
                  </label>
                  <input
                    type="date"
                    value={expediente.fecha_termino ? new Date(expediente.fecha_termino).toISOString().slice(0, 10) : ''}
                    onChange={handleFechaTerminoChange}
                  />
                </div>
              )}
            </div>

            <div className="exp-actions">
              <button className="btn btn-primary" onClick={handleAvanzar}>Avanzar</button>
              <button className="btn btn-secondary" onClick={handleDevolver}>Devolver</button>
              <button className="btn btn-primary" onClick={() => setShowUploadModal(true)}>Adjuntar archivo</button>
            </div>

            <div className="exp-section">
              <h4>Historial</h4>
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
              <h4>Documentos</h4>
              {documentos.length > 0 ? (
                <table className="users-table">
                  <thead><tr><th>Nombre</th><th>Tipo</th><th>Tamaño</th><th>Versión</th><th>Fecha</th><th>Acciones</th></tr></thead>
                  <tbody>
                    {documentos.map(d => (
                      <>
                        <tr key={d.id}>
                          <td>
                            <button
                              className="doc-name-toggle"
                              onClick={() => setExpandedDocId(expandedDocId === d.id ? null : d.id)}
                              title={expandedDocId === d.id ? 'Ocultar versiones' : 'Ver versiones'}
                            >
                              <span className="toggle-icon">{expandedDocId === d.id ? '▼' : '▶'}</span>
                              {d.nombre_archivo}
                            </button>
                          </td>
                          <td>{d.tipo_mime}</td>
                          <td>{(d.tamano_bytes / 1024).toFixed(1)} KB</td>
                          <td>v{d.version || 1}</td>
                          <td>{new Date(d.fecha_upload).toLocaleDateString()}</td>
                          <td>
                            <button
                              className="btn btn-small"
                              onClick={() => handleDownloadDocumento(d)}
                              title="Descargar"
                            >
                              📥
                            </button>
                            <button
                              className="btn btn-small btn-primary"
                              onClick={() => handleNuevaVersion(d)}
                              title="Nueva versión"
                              style={{ marginLeft: '4px' }}
                            >
                              ➕
                            </button>
                          </td>
                        </tr>
                        {expandedDocId === d.id && (
                          <tr key={`${d.id}-timeline`}>
                            <td colSpan={6}>
                              <DocumentTimeline documentoId={d.id} documento={d} />
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              ) : <p className="empty-text">Sin documentos adjuntos</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Upload Modal for new documents - rendered as separate overlay */}
      {showUploadModal && (
        <UploadModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          expedienteId={expediente?.id}
          onUploadComplete={handleUploadComplete}
        />
      )}

      {/* Upload Modal for new version of existing document - rendered as separate overlay */}
      {showNuevaVersionModal && (
        <UploadModal
          isOpen={showNuevaVersionModal}
          onClose={() => {
            setShowNuevaVersionModal(false)
            setDocumentoParaNuevaVersion(null)
          }}
          documentoId={documentoParaNuevaVersion?.id}
          onUploadComplete={handleNuevaVersionComplete}
        />
      )}
    </>
  )
}

export default ExpedienteDetalle
