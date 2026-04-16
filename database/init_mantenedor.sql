CREATE TABLE contratistas (
    id SERIAL PRIMARY KEY,
    razon_social VARCHAR(150) NOT NULL,
    rut VARCHAR(20) UNIQUE NOT NULL,
    estado_activo BOOLEAN DEFAULT true
);

CREATE TABLE areas (
    id SERIAL PRIMARY KEY,
    contratista_id INTEGER REFERENCES contratistas(id),
    nombre VARCHAR(100) NOT NULL,
    estado_activo BOOLEAN DEFAULT true
);

CREATE TABLE disciplinas (
    id SERIAL PRIMARY KEY,
    area_id INTEGER REFERENCES areas(id),
    nombre VARCHAR(100) NOT NULL,
    estado_activo BOOLEAN DEFAULT true
);

CREATE TABLE categorias (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    estado_activo BOOLEAN DEFAULT true
);

CREATE TABLE subtipos (
    id SERIAL PRIMARY KEY,
    categoria_id INTEGER REFERENCES categorias(id),
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    estado_activo BOOLEAN DEFAULT true
);

-- Datos de ejemplo iniciales
INSERT INTO contratistas (razon_social, rut) VALUES ('Constructora Alpha', '76.123.456-K');
INSERT INTO contratistas (razon_social, rut) VALUES ('Constructora Beta', '77.132.465-K');
INSERT INTO areas (contratista_id, nombre) VALUES (1, 'Ingeniería'), (1, 'Prevención de Riesgos');
INSERT INTO areas (contratista_id, nombre) VALUES (2, 'Finanzas'), (2, 'Logística');
INSERT INTO disciplinas (area_id, nombre) VALUES (1, 'Estudio de Suelos'), (1, 'Charlas de Seguridad');
INSERT INTO disciplinas (area_id, nombre) VALUES (2, 'Contabilidad'), (2, 'Gestión de Inventario');

-- Categorías y Subtipos de documentos
INSERT INTO categorias (nombre, descripcion) VALUES
('Seguridad', 'Documentos relacionados con seguridad y prevención de riesgos'),
('Calidad', 'Documentos de gestión de calidad ISO'),
('Ingeniería', 'Documentos técnicos de ingeniería'),
('Legal', 'Documentos legales y contractuales');

INSERT INTO subtipos (categoria_id, nombre, descripcion) VALUES
(1, 'Charla de 5 min', 'Charla diaria de seguridad'),
(1, 'PPE', 'Procedimientos de protección personal'),
(1, 'Informe de incidentes', 'Reporte de accidentes e incidentes'),
(2, 'Plan de calidad', 'Plan de gestión de calidad'),
(2, 'Procedimiento ISO', 'Procedimientos según norma ISO'),
(3, 'Planos', 'Planos técnicos y ingenieriles'),
(3, 'Estudios de suelo', 'Estudios geotécnicos'),
(4, 'Contrato', 'Documentos contractuales'),
(4, 'Carta garantia', 'Cartas de garantia');