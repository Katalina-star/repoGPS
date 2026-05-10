-- Add fecha_termino to expedientes (optional deadline)
ALTER TABLE expedientes
ADD COLUMN IF NOT EXISTS fecha_termino DATE;
