-- Migration: Create documentos_version table
-- Stores historical versions of documents
-- Date: 2026-05-19

-- Create table for document version history
CREATE TABLE IF NOT EXISTS documentos_version (
    id SERIAL PRIMARY KEY,
    documento_id INTEGER NOT NULL REFERENCES documentos(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    ruta_garage VARCHAR(500) NOT NULL,
    nombre_archivo VARCHAR(255) NOT NULL,
    tipo_mime VARCHAR(100),
    tamano_bytes INTEGER,
    fecha_upload TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    usuario_upload_id INTEGER,
    es_version_actual BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for querying versions by document
CREATE INDEX IF NOT EXISTS idx_documentos_version_documento 
ON documentos_version(documento_id, version DESC);

-- Index for finding all versions of a document
CREATE INDEX IF NOT EXISTS idx_documentos_version_by_doc
ON documentos_version(documento_id)
WHERE es_version_actual = true;

-- Unique constraint: one version number per document
CREATE UNIQUE INDEX IF NOT EXISTS idx_documentos_version_unique 
ON documentos_version(documento_id, version);

-- Partial index for current versions
CREATE INDEX IF NOT EXISTS idx_documentos_version_actual_query 
ON documentos_version(documento_id, version DESC) 
WHERE es_version_actual = true;

-- Add foreign key to documents table
ALTER TABLE documentos_version 
ADD CONSTRAINT fk_documentos_version_documento 
FOREIGN KEY (documento_id) REFERENCES documentos(id) ON DELETE CASCADE;

-- Add comments
COMMENT ON TABLE documentos_version IS 'Historical versions of uploaded documents';
COMMENT ON COLUMN documentos_version.documento_id IS 'Reference to parent documento';
COMMENT ON COLUMN documentos_version.version IS 'Version number (1-based)';
COMMENT ON COLUMN documentos_version.ruta_garage IS 'Path in GarageHQ storage';
COMMENT ON COLUMN documentos_version.es_version_actual IS 'Marks the current active version';

-- Function to sync version state when inserting new versions
-- This ensures only one version is marked as es_version_actual per documento
CREATE OR REPLACE FUNCTION set_version_actual()
RETURNS TRIGGER AS $$
BEGIN
    -- If this version is marked as actual, unset others first
    IF NEW.es_version_actual = true THEN
        UPDATE documentos_version 
        SET es_version_actual = false 
        WHERE documento_id = NEW.documento_id;
        
        -- Also update the main documentos table
        UPDATE documentos 
        SET es_version_actual = false 
        WHERE id = NEW.documento_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to maintain version consistency
DROP TRIGGER IF EXISTS trigger_set_version_actual ON documentos_version;
CREATE TRIGGER trigger_set_version_actual
    BEFORE INSERT ON documentos_version
    FOR EACH ROW
    EXECUTE FUNCTION set_version_actual();