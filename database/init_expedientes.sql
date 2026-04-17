-- ******************************************************
-- MICROSERVICIO: db_expedientes
-- Gestión de Workflows y Expedientes
-- ******************************************************

-- Procesos (relación lógica con áreas via area_id)
CREATE TABLE procesos (
    id SERIAL PRIMARY KEY,
    area_id INTEGER NOT NULL, -- Soft FK hacia db_mantenedores.areas
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    estado_activo BOOLEAN DEFAULT true
);

-- Etapas de cada proceso
CREATE TABLE etapas_proceso (
    id SERIAL PRIMARY KEY,
    proceso_id INTEGER REFERENCES procesos(id) ON DELETE CASCADE,
    nombre VARCHAR(100) NOT NULL,
    orden INTEGER NOT NULL, -- posición de la etapa en el flujo
    es_final BOOLEAN DEFAULT false, -- etapa final = expediente cerrado
    estado_activo BOOLEAN DEFAULT true
);

-- Tabla central de expedientes
CREATE TABLE expedientes (
    id SERIAL PRIMARY KEY,
    proceso_id INTEGER REFERENCES procesos(id),
    disciplina_id INTEGER NOT NULL, -- Soft FK hacia db_mantenedores.disciplinas
    subtipo_id INTEGER, -- Soft FK hacia db_mantenedores.subtipos
    etapa_actual_id INTEGER REFERENCES etapas_proceso(id),
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado_activo BOOLEAN DEFAULT true
);

-- Documentos adjuntos a expediente
CREATE TABLE documentos (
    id SERIAL PRIMARY KEY,
    expediente_id INTEGER REFERENCES expedientes(id) ON DELETE CASCADE,
    nombre_archivo VARCHAR(255) NOT NULL,
    ruta_archivo VARCHAR(500) NOT NULL,
    tipo_mime VARCHAR(100),
    tamano_bytes INTEGER,
    fecha_upload TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado_activo BOOLEAN DEFAULT true
);

-- Historial de cambios de etapa (trazabilidad)
CREATE TABLE historial_etapas (
    id SERIAL PRIMARY KEY,
    expediente_id INTEGER REFERENCES expedientes(id) ON DELETE CASCADE,
    etapa_anterior_id INTEGER REFERENCES etapas_proceso(id),
    etapa_nueva_id INTEGER REFERENCES etapas_proceso(id),
    usuario_id INTEGER NOT NULL, -- Soft FK hacia db_usuarios.usuarios
    fecha_cambio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    observacion TEXT
);

-- Tareas asignadas a usuarios
CREATE TABLE tareas_asignadas (
    id SERIAL PRIMARY KEY,
    expediente_id INTEGER REFERENCES expedientes(id) ON DELETE CASCADE,
    usuario_id INTEGER NOT NULL, -- Soft FK hacia db_usuarios.usuarios
    tipo_tarea VARCHAR(50) NOT NULL, -- 'revision', 'aprobacion', 'visacion'
    estado VARCHAR(20) DEFAULT 'pendiente', -- pendiente, completada, rechazada
    fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_termino TIMESTAMP,
    observacion TEXT
);

-- ******************************************************
-- Datos de ejemplo iniciales
-- ******************************************************

-- Procesos de ejemplo
INSERT INTO procesos (area_id, nombre, descripcion) VALUES
(1, 'Aprobación de Estudios', 'Flujo para aprobar estudios técnicos'),
(1, 'Revisión de Seguridad', 'Flujo de revisión de documentos de seguridad'),
(2, 'Certificación Contable', 'Flujo de certificación de documentos contables');

-- Etapas del proceso 1 (Aprobación de Estudios)
INSERT INTO etapas_proceso (proceso_id, nombre, orden, es_final) VALUES
(1, 'Pendiente', 1, false),
(1, 'En Revisión', 2, false),
(1, 'En Aprobación', 3, false),
(1, 'Aprobado', 4, true);

-- Etapas del proceso 2 (Revisión de Seguridad)
INSERT INTO etapas_proceso (proceso_id, nombre, orden, es_final) VALUES
(2, 'Pendiente', 1, false),
(2, 'En Revisión Técnica', 2, false),
(2, 'Visado', 3, false),
(2, 'Aprobado', 4, true);

-- Etapas del proceso 3 (Certificación Contable)
INSERT INTO etapas_proceso (proceso_id, nombre, orden, es_final) VALUES
(3, 'Pendiente', 1, false),
(3, 'En Auditoría', 2, false),
(3, 'Certificado', 3, true);

-- Expedientes de ejemplo
INSERT INTO expedientes (proceso_id, disciplina_id, subtipo_id, etapa_actual_id, titulo, descripcion) VALUES
(1, 1, 7, 4, 'Estudio de Suelos - Edificio A', 'Estudio geotécnico para edificio de 5 pisos'),
(2, 2, 1, 3, 'Charla Seguridad Abril', 'Charla mensual de seguridad'),
(3, 4, 5, 2, 'Estado Financiero Q1', 'Estados financieros del primer trimestre');

-- Documentos de ejemplo
INSERT INTO documentos (expediente_id, nombre_archivo, ruta_archivo, tipo_mime, tamano_bytes) VALUES
(1, 'suelo_edificio_a.pdf', '/uploads/expedientes/1/suelo_edificio_a.pdf', 'application/pdf', 2048576),
(1, 'memoria_calculo.pdf', '/uploads/expedientes/1/memoria_calculo.pdf', 'application/pdf', 1024000),
(2, 'presentacion_seguridad.pptx', '/uploads/expedientes/2/presentacion.pptx', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 512000),
(3, 'balance_q1.xlsx', '/uploads/expedientes/3/balance_q1.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 256000);

-- Historial de ejemplo
INSERT INTO historial_etapas (expediente_id, etapa_anterior_id, etapa_nueva_id, usuario_id, observacion) VALUES
(1, 1, 2, 1, 'Expediente creado y en revisión'),
(1, 2, 3, 1, 'Revisión técnica completada'),
(1, 3, 4, 2, 'Aprobado para construcción');

-- Tareas de ejemplo
INSERT INTO tareas_asignadas (expediente_id, usuario_id, tipo_tarea, estado, observacion) VALUES
(2, 3, 'revision', 'pendiente', 'Revisar presentación de seguridad'),
(2, 2, 'aprobacion', 'pendiente', 'Aprobar Charla de Seguridad Abril'),
(3, 4, 'revision', 'completada', 'Auditoría completada');