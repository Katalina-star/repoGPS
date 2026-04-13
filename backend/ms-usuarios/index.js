const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  user: 'postgres',
  host: 'db',
  database: 'db_usuarios',
  password: 'password123',
  port: 5432,
});

// LISTAR ROLES
app.get('/api/roles', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM roles WHERE estado_activo = true ORDER BY id ASC'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CREAR USUARIO
app.post('/api/usuarios', async (req, res) => {
  const { rol_id, nombre_completo, correo, password_hash } = req.body;

  try {
    const result = await pool.query(
      `
      INSERT INTO usuarios (rol_id, nombre_completo, correo, password_hash)
      VALUES ($1, $2, $3, $4)
      RETURNING *
      `,
      [rol_id, nombre_completo, correo, password_hash]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// LISTAR USUARIOS
app.get('/api/usuarios', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        u.id,
        u.nombre_completo,
        u.correo,
        u.password_hash,
        u.estado_activo,
        u.rol_id,
        r.nombre AS rol_nombre
      FROM usuarios u
      INNER JOIN roles r ON u.rol_id = r.id
      ORDER BY u.id ASC
    `);

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// OBTENER USUARIO POR ID
app.get('/api/usuarios/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `
      SELECT
        u.id,
        u.nombre_completo,
        u.correo,
        u.password_hash,
        u.estado_activo,
        u.rol_id,
        r.nombre AS rol_nombre
      FROM usuarios u
      INNER JOIN roles r ON u.rol_id = r.id
      WHERE u.id = $1
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// EDITAR USUARIO
app.put('/api/usuarios/:id', async (req, res) => {
  const { id } = req.params;
  const { rol_id, nombre_completo, correo, password_hash, estado_activo } = req.body;

  try {
    const result = await pool.query(
      `
      UPDATE usuarios
      SET rol_id = $1,
          nombre_completo = $2,
          correo = $3,
          password_hash = $4,
          estado_activo = $5
      WHERE id = $6
      RETURNING *
      `,
      [rol_id, nombre_completo, correo, password_hash, estado_activo, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ACTIVAR / DESACTIVAR USUARIO
app.patch('/api/usuarios/:id/estado', async (req, res) => {
  const { id } = req.params;
  const { estado_activo } = req.body;

  try {
    const result = await pool.query(
      `
      UPDATE usuarios
      SET estado_activo = $1
      WHERE id = $2
      RETURNING *
      `,
      [estado_activo, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({
      mensaje: estado_activo
        ? 'Usuario activado correctamente'
        : 'Usuario desactivado correctamente',
      usuario: result.rows[0],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ELIMINAR USUARIO DEFINITIVAMENTE
app.delete('/api/usuarios/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `
      DELETE FROM usuarios
      WHERE id = $1
      RETURNING *
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({
      mensaje: 'Usuario eliminado correctamente',
      usuario: result.rows[0],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(3000, () => {
  console.log('Servidor Backend corriendo en el puerto 3000');
});