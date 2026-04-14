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

-- Datos de ejemplo iniciales
INSERT INTO contratistas (razon_social, rut) VALUES ('Constructora Alpha', '76.123.456-K');
INSERT INTO contratistas (razon_social, rut) VALUES ('Constructora Beta', '77.132.465-K');
INSERT INTO areas (contratista_id, nombre) VALUES (1, 'Ingeniería'), (1, 'Prevención de Riesgos');
INSERT INTO areas (contratista_id, nombre) VALUES (2, 'Finanzas'), (2, 'Logística');
INSERT INTO disciplinas (area_id, nombre) VALUES (1, 'Estudio de Suelos'), (1, 'Charlas de Seguridad');
INSERT INTO disciplinas (area_id, nombre) VALUES (2, 'Contabilidad'), (2, 'Gestión de Inventario');