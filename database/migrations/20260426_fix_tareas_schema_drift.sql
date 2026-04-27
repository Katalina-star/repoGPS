-- ==============================================================
-- Migration: Fix schema drift for Bandeja de Tareas (ms-expedientes)
-- Date: 2026-04-26
-- Idempotent: YES
-- ==============================================================

BEGIN;

-- 1) tareas_asignadas: columnas requeridas por backend actual
ALTER TABLE IF EXISTS tareas_asignadas
  ADD COLUMN IF NOT EXISTS etapa_id INTEGER;

ALTER TABLE IF EXISTS tareas_asignadas
  ADD COLUMN IF NOT EXISTS fecha_visto TIMESTAMP;

-- 2) Backfill de etapa_id desde etapa actual del expediente
UPDATE tareas_asignadas t
SET etapa_id = e.etapa_actual_id
FROM expedientes e
WHERE t.expediente_id = e.id
  AND t.etapa_id IS NULL;

-- 3) FK para etapa_id (si no existe)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'tareas_asignadas_etapa_id_fkey'
  ) THEN
    ALTER TABLE tareas_asignadas
      ADD CONSTRAINT tareas_asignadas_etapa_id_fkey
      FOREIGN KEY (etapa_id) REFERENCES etapas_proceso(id);
  END IF;
END $$;

-- 4) Índices para consultas de bandeja
CREATE INDEX IF NOT EXISTS idx_tareas_usuario_estado ON tareas_asignadas(usuario_id, estado);
CREATE INDEX IF NOT EXISTS idx_tareas_etapa_id ON tareas_asignadas(etapa_id);
CREATE INDEX IF NOT EXISTS idx_tareas_expediente_id ON tareas_asignadas(expediente_id);

-- 5) etapas_proceso: columnas requeridas para joins y filtros
ALTER TABLE IF EXISTS etapas_proceso
  ADD COLUMN IF NOT EXISTS tipo_tarea VARCHAR(50);

ALTER TABLE IF EXISTS etapas_proceso
  ADD COLUMN IF NOT EXISTS rol_id INTEGER;

-- 6) Backfill heurístico para tipo_tarea
UPDATE etapas_proceso
SET tipo_tarea = CASE
  WHEN LOWER(nombre) LIKE '%revisi%' THEN 'revision'
  WHEN LOWER(nombre) LIKE '%aprob%' THEN 'aprobacion'
  WHEN LOWER(nombre) LIKE '%visa%' THEN 'visacion'
  ELSE tipo_tarea
END
WHERE tipo_tarea IS NULL;

-- 7) Backfill heurístico para rol_id (ajustable por negocio)
UPDATE etapas_proceso
SET rol_id = CASE
  WHEN tipo_tarea = 'revision' THEN 2
  WHEN tipo_tarea = 'aprobacion' THEN 3
  WHEN tipo_tarea = 'visacion' THEN 4
  ELSE rol_id
END
WHERE rol_id IS NULL;

COMMIT;
