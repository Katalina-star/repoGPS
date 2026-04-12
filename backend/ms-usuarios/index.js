const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "db_usuarios",
  password: "password123",
  port: 5433,
});

// LISTAR ROLES
app.get("/api/roles", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM roles WHERE estado_activo = true ORDER BY id ASC",
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/usuarios", async (req, res) => {
  const { rol_id, area_id, nombre_completo, correo, password_hash } = req.body;

  try {
    const resultUsuario = await pool.query(
      `
      INSERT INTO usuarios (rol_id, nombre_completo, correo, password_hash)
      VALUES ($1, $2, $3, $4)
      RETURNING *
      `,
      [rol_id, nombre_completo, correo, password_hash],
    );

    const nuevoUsuario = resultUsuario.rows[0];

    if (area_id) {
      await pool.query(
        `INSERT INTO usuario_area (usuario_id, area_id) VALUES ($1, $2)`,
        [nuevoUsuario.id, area_id],
      );
    }

    res.status(201).json(nuevoUsuario);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/usuarios', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        u.id, u.nombre_completo, u.correo, u.password_hash, u.estado_activo, u.rol_id,
        r.nombre AS rol_nombre, ua.area_id, a.nombre AS area_nombre
      FROM usuarios u
      INNER JOIN roles r ON u.rol_id = r.id
      LEFT JOIN usuario_area ua ON u.id = ua.usuario_id
      LEFT JOIN areas a ON ua.area_id = a.id
      /* Quitamos el WHERE de estado_activo para recibir todo */
      ORDER BY u.id ASC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// OBTENER USUARIO POR ID
app.get("/api/usuarios/:id", async (req, res) => {
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
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// EDITAR USUARIO
app.put('/api/usuarios/:id', async (req, res) => {
  const { id } = req.params;
  const { rol_id, area_id, nombre_completo, correo, estado_activo } = req.body;

  try {
    await pool.query('BEGIN');

    await pool.query(
      `
      UPDATE usuarios 
      SET rol_id = $1, nombre_completo = $2, correo = $3, estado_activo = $4 
      WHERE id = $5
      `,
      [rol_id, nombre_completo, correo, estado_activo, id]
    );

    if (area_id) {
      await pool.query('DELETE FROM usuario_area WHERE usuario_id = $1', [id]);
      await pool.query(
        'INSERT INTO usuario_area (usuario_id, area_id) VALUES ($1, $2)',
        [id, area_id]
      );
    }

    await pool.query('COMMIT');
    res.json({ message: 'Usuario y área actualizados correctamente' });
  } catch (err) {
    await pool.query('ROLLBACK'); 
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar el usuario y su área' });
  }
});

// ACTIVAR / DESACTIVAR USUARIO
app.patch('/api/usuarios/:id/estado', async (req, res) => {
  const { id } = req.params;
  const { estado_activo } = req.body; 
  try {
    await pool.query('UPDATE usuarios SET estado_activo = $1 WHERE id = $2', [estado_activo, id]);
    res.json({ message: 'Estado actualizado correctamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/usuarios/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('UPDATE usuarios SET estado_activo = false WHERE id = $1', [id]);
    res.json({ message: 'Usuario eliminado lógicamente (Desactivado)' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/contratistas", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM contratistas WHERE estado_activo = true ORDER BY id ASC",
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/contratistas", async (req, res) => {
  const { razon_social, rut } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO contratistas (razon_social, rut) VALUES ($1, $2) RETURNING *",
      [razon_social, rut],
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/areas", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT a.id, a.nombre, a.estado_activo, c.razon_social AS contratista_nombre 
      FROM areas a
      INNER JOIN contratistas c ON a.contratista_id = c.id
      WHERE a.estado_activo = true 
      ORDER BY a.id ASC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/areas", async (req, res) => {
  const { contratista_id, nombre } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO areas (contratista_id, nombre) VALUES ($1, $2) RETURNING *",
      [contratista_id, nombre],
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/disciplinas", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT d.id, d.nombre, d.estado_activo, a.nombre AS area_nombre 
      FROM disciplinas d
      INNER JOIN areas a ON d.area_id = a.id
      WHERE d.estado_activo = true 
      ORDER BY d.id ASC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/disciplinas", async (req, res) => {
  const { area_id, nombre } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO disciplinas (area_id, nombre) VALUES ($1, $2) RETURNING *",
      [area_id, nombre],
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(3000, () => {
  console.log("Servidor Backend corriendo en el puerto 3000");
});
