import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useDocumentos } from '../../hooks/useDocumentos'

export const UploadModal = ({ isOpen, onClose, expedienteId, documentoId, onUploadComplete }) => {
  const [selectedFile, setSelectedFile] = useState(null)
  const [descripcion, setDescripcion] = useState('')
  const { uploadDocumento, crearVersion, uploading, uploadProgress, error, clearError } = useDocumentos()

  // modo 'nuevaVersion' =true cuando documentoId está presente
  const isNuevaVersion = !!documentoId

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      setSelectedFile(acceptedFiles[0])
      clearError()
    }
  }, [clearError])

  // Construction document extensions
  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.dwg': ['.dwg'],
      'application/vnd.dxf': ['.dxf'],
      'application/x-rvt': ['.rvt'],
      'application/x-sketchup': ['.skp'],
      'application/x-ifc': ['.ifc'],
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/tiff': ['.tiff', '.tif']
    },
    maxFiles: 1,
    disabled: uploading
  })

  const handleUpload = async () => {
    if (!selectedFile) return

    try {
      let result
      if (isNuevaVersion && documentoId) {
        // Create new version for existing document
        result = await crearVersion(documentoId, selectedFile, descripcion, () => {
          // Progress is handled by the hook
        })
      } else if (expedienteId) {
        // Upload new document to expediente
        result = await uploadDocumento(expedienteId, selectedFile, descripcion, () => {
          // Progress is handled by the hook
        })
      } else {
        return
      }

      if (onUploadComplete) {
        onUploadComplete(result)
      }

      // Reset and close
      setSelectedFile(null)
      setDescripcion('')
      onClose()
    } catch {
      // Error is handled by the hook
    }
  }

  const handleClose = () => {
    setSelectedFile(null)
    setDescripcion('')
    clearError()
    onClose()
  }

  if (!isOpen) return null

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content modal-content--upload" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{isNuevaVersion ? 'Nueva Versión' : 'Subir Documento'}</h3>
          <button className="modal-close" onClick={handleClose}>×</button>
        </div>

        <div className="modal-body">
          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={`dropzone ${isDragActive ? 'active' : ''} ${isDragReject ? 'reject' : ''} ${uploading ? 'disabled' : ''}`}
          >
            <input {...getInputProps()} />
            {selectedFile ? (
              <div className="selected-file">
                <span className="file-icon">📄</span>
                <div className="file-info">
                  <p className="file-name">{selectedFile.name}</p>
                  <p className="file-size">{formatFileSize(selectedFile.size)}</p>
                </div>
                {!uploading && (
                  <button
                    className="btn-remove-file"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedFile(null)
                    }}
                  >
                    ×
                  </button>
                )}
              </div>
            ) : (
              <div className="dropzone-content">
                {uploading ? (
                  <p>Subiendo archivo...</p>
                ) : (
                  <>
                    <p className="dropzone-title">
                      {isDragActive ? 'Suelta el archivo aquí' : 'Arrastra un archivo o haz click para seleccionar'}
                    </p>
                    <p className="dropzone-hint">PDF, DWG, DXF, RVT, SKP, IFC, XLSX, DOC, DOCX, JPG, PNG, TIFF (max 50MB)</p>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Progress Bar */}
          {uploading && (
            <div className="upload-progress">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${uploadProgress}%` }}></div>
              </div>
              <p className="progress-text">{uploadProgress}%</p>
            </div>
          )}

          {/* Description */}
          <div className="form-group">
            <label>Descripción (opcional)</label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Agrega una descripción al documento..."
              disabled={uploading}
              rows={3}
            />
          </div>

          {/* Error */}
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={handleClose} disabled={uploading}>
            Cancelar
          </button>
          <button
            className="btn-primary"
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
          >
            {uploading ? 'Subiendo...' : (isNuevaVersion ? 'Crear Nueva Versión' : 'Subir Documento')}
          </button>
        </div>
      </div>

      <style>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: white;
          border-radius: 8px;
          width: 90%;
          max-width: 500px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        }

        .modal-content--upload {
          width: 70vw;
          max-width: 800px;
          max-height: 70vh;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid #eee;
        }

        .modal-header h3 {
          margin: 0;
          font-size: 18px;
          color: #333;
        }

        .modal-close {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #666;
          padding: 0;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .modal-body {
          padding: 20px;
        }

        .dropzone {
          border: 2px dashed #ddd;
          border-radius: 8px;
          padding: 30px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
          margin-bottom: 16px;
        }

        .dropzone.active {
          border-color: #4CAF50;
          background: #f9fff9;
        }

        .dropzone.reject {
          border-color: #f44336;
          background: #fff9f9;
        }

        .dropzone.disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .dropzone-content {
          color: #666;
        }

        .dropzone-title {
          margin: 0 0 8px;
          font-size: 14px;
        }

        .dropzone-hint {
          margin: 0;
          font-size: 12px;
          color: #999;
        }

        .selected-file {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .file-icon {
          font-size: 32px;
        }

        .file-info {
          flex: 1;
          text-align: left;
        }

        .file-name {
          margin: 0;
          font-size: 14px;
          font-weight: 500;
          color: #333;
        }

        .file-size {
          margin: 4px 0 0;
          font-size: 12px;
          color: #999;
        }

        .btn-remove-file {
          background: #f44336;
          color: white;
          border: none;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          cursor: pointer;
          font-size: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .upload-progress {
          margin-bottom: 16px;
        }

        .progress-bar {
          height: 8px;
          background: #e0e0e0;
          border-radius: 4px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: #4CAF50;
          transition: width 0.2s;
        }

        .progress-text {
          text-align: center;
          margin: 8px 0 0;
          font-size: 12px;
          color: #666;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-size: 14px;
          font-weight: 500;
          color: #333;
        }

        .form-group textarea {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
          resize: vertical;
        }

        .form-group textarea:disabled {
          background: #f5f5f5;
        }

        .error-message {
          padding: 12px;
          background: #fff3f3;
          border: 1px solid #ffcdd2;
          border-radius: 4px;
          color: #c62828;
          font-size: 14px;
          margin-bottom: 16px;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 16px 20px;
          border-top: 1px solid #eee;
        }

        .btn-cancel, .btn-primary {
          padding: 10px 20px;
          border-radius: 4px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-cancel {
          background: white;
          border: 1px solid #ddd;
          color: #666;
        }

        .btn-cancel:hover:not(:disabled) {
          background: #f5f5f5;
        }

        .btn-primary {
          background: #4CAF50;
          border: none;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: #45a049;
        }

        .btn-primary:disabled, .btn-cancel:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  )
}