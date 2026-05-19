-- Migration: Add versioning columns to documentos table
-- Adds support for document versioning with GarageHQ storage
-- Date: 2026-05-19

-- Add version tracking columns to documentos table
ALTER TABLE documentos 
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS ruta_garage VARCHAR(500),
ADD COLUMN IF NOT EXISTS usuario_upload_id INTEGER,
ADD COLUMN IF NOT EXISTS es_version_actual BOOLEAN DEFAULT true;

-- Add index for faster queries on versioned documents
CREATE INDEX IF NOT EXISTS idx_documentos_expediente_version 
ON documentos(expediente_id, version DESC);

CREATE INDEX IF NOT EXISTS idx_documentos_version_actual 
ON documentos(expediente_id, es_version_actual) 
WHERE es_version_actual = true;

-- Add index on ruta_garage for storage lookups
CREATE INDEX IF NOT EXISTS idx_documentos_ruta_garage 
ON documentos(ruta_garage) WHERE ruta_garage IS NOT NULL;

-- Add unique constraint for version per documento (one current version)
-- Note: This uses a partial unique index for version_actual documents
CREATE UNIQUE INDEX IF NOT EXISTS idx_documentos_unique_actual_version 
ON documentos(expediente_id, nombre_archivo) 
WHERE es_version_actual = true AND estado_activo = true;

COMMENT ON COLUMN documentos.version IS 'Version number (1, 2, 3...)';
COMMENT ON COLUMN documentos.ruta_garage IS 'Path in GarageHQ storage';
COMMENT ON COLUMN documentos.usuario_upload_id IS 'User who uploaded the file';
COMMENT ON COLUMN documentos.es_version_actual IS 'True if this is the current version';