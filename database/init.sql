CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    estado_activo BOOLEAN DEFAULT true
);

CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    rol_id INTEGER REFERENCES roles(id),
    nombre_completo VARCHAR(100) NOT NULL,
    correo VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    estado_activo BOOLEAN DEFAULT true
);

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

CREATE TABLE usuario_area (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    area_id INTEGER REFERENCES areas(id) ON DELETE CASCADE
);

INSERT INTO contratistas (razon_social, rut) VALUES ('Constructora Alpha', '76.123.456-K');
INSERT INTO contratistas (razon_social, rut) VALUES ('Constructora Beta', '77.132.465-K');
INSERT INTO areas (contratista_id, nombre) VALUES (1, 'Ingeniería'), (1, 'Prevención de Riesgos');
INSERT INTO areas (contratista_id, nombre) VALUES (2, 'Finanzas'), (2, 'Coludido');
INSERT INTO disciplinas (area_id, nombre) VALUES (1, 'Estudio de Suelos'), (1, 'Charlas de Seguridad');
INSERT INTO disciplinas (area_id, nombre) VALUES (2, 'Estudio de Estafa'), (2, 'Charlas de Gestión');
INSERT INTO roles (nombre) VALUES 
('Administrador'), 
('Revisor'), 
('Aprobador'), 
('Colaborador'), 
('Visador');

