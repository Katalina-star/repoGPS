import { useState, useEffect } from 'react'
import { useDocumentos } from '../../hooks/useDocumentos'

export const DocumentTimeline = ({ documentoId, documento }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [versiones, setVersiones] = useState([])
  const { getVersiones, loading, error, downloadAndSave } = useDocumentos()

  useEffect(() => {
    if (isExpanded && documentoId) {
      loadVersiones()
    }
  }, [isExpanded, documentoId])

  const loadVersiones = async () => {
    try {
      const data = await getVersiones(documentoId)
      setVersiones(data || [])
    } catch (err) {
      console.error('Error loading versions:', err)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Fecha no disponible'
    const date = new Date(dateString)
    return date.toLocaleDateString('es-CL', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatFileSize = (bytes) => {
    if (!bytes) return '-'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const handleDownload = async (version) => {
    try {
      await downloadAndSave(documentoId, version.version, version.nombre_archivo)
    } catch (err) {
      console.error('Error downloading:', err)
    }
  }

  const currentVersion = documento?.version || 1
  const hasMultipleVersions = currentVersion > 1 || versiones.length > 1

  return (
    <div className="document-timeline">
      {hasMultipleVersions && (
        <>
          <button
            className="timeline-toggle"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <span className="toggle-icon">{isExpanded ? '▼' : '▶'}</span>
            <span>Versiones ({versiones.length || currentVersion})</span>
          </button>

          {isExpanded && (
            <div className="timeline-content">
              {loading ? (
                <p className="loading-text">Cargando versiones...</p>
              ) : error ? (
                <p className="error-text">{error}</p>
              ) : (
                <div className="timeline-list">
                  {versiones.map((version, index) => (
                    <div
                      key={version.id || `v${version.version}`}
                      className={`timeline-item ${version.es_version_actual ? 'current' : ''}`}
                    >
                      <div className="timeline-dot">
                        {version.es_version_actual ? (
                          <span className="dot-current">●</span>
                        ) : (
                          <span className="dot-past">○</span>
                        )}
                      </div>

                      <div className="timeline-body">
                        <div className="version-header">
                          <span className="version-number">Versión {version.version}</span>
                          {version.es_version_actual && (
                            <span className="version-badge">Actual</span>
                          )}
                        </div>

                        <div className="version-meta">
                          <span className="meta-date">{formatDate(version.fecha_upload)}</span>
                          <span className="meta-size">{formatFileSize(version.tamano_bytes)}</span>
                          <span className="meta-type">{version.tipo_mime}</span>
                        </div>

                        <button
                          className="btn-download-version"
                          onClick={() => handleDownload(version)}
                        >
                          ↓ Descargar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      <style>{`
        .document-timeline {
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px solid #eee;
        }

        .timeline-toggle {
          background: none;
          border: none;
          color: #666;
          font-size: 13px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 4px 0;
        }

        .timeline-toggle:hover {
          color: #4CAF50;
        }

        .toggle-icon {
          font-size: 10px;
        }

        .timeline-content {
          margin-top: 12px;
          padding-left: 12px;
        }

        .loading-text, .error-text {
          font-size: 12px;
          color: #999;
          margin: 8px 0;
        }

        .error-text {
          color: #f44336;
        }

        .timeline-list {
          border-left: 2px solid #e0e0e0;
          padding-left: 16px;
        }

        .timeline-item {
          position: relative;
          padding-bottom: 16px;
        }

        .timeline-item:last-child {
          padding-bottom: 0;
        }

        .timeline-dot {
          position: absolute;
          left: -21px;
          top: 0;
        }

        .dot-current {
          color: #4CAF50;
          font-size: 14px;
        }

        .dot-past {
          color: #bbb;
          font-size: 12px;
        }

        .timeline-body {
          background: #f9f9f9;
          border-radius: 4px;
          padding: 10px;
        }

        .timeline-item.current .timeline-body {
          background: #f1f8f1;
        }

        .version-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 6px;
        }

        .version-number {
          font-weight: 600;
          font-size: 13px;
          color: #333;
        }

        .version-badge {
          background: #4CAF50;
          color: white;
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 3px;
        }

        .version-meta {
          display: flex;
          gap: 12px;
          font-size: 11px;
          color: #999;
          margin-bottom: 8px;
        }

        .btn-download-version {
          background: white;
          border: 1px solid #ddd;
          color: #666;
          font-size: 11px;
          padding: 4px 8px;
          border-radius: 3px;
          cursor: pointer;
        }

        .btn-download-version:hover {
          background: #f5f5f5;
          border-color: #ccc;
        }
      `}</style>
    </div>
  )
}