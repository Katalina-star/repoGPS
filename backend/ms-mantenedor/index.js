const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
app.use(cors());
app.use(express.json());

// Conexión a db_mantenedor
const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "db_mantenedor",
  database: process.env.DB_NAME || "db_mantenedor",
  password: process.env.DB_PASSWORD || "password123",
  port: process.env.DB_PORT || 5432,
});

// ============================================
// CONTRATISTAS
// ============================================

app.get("/api/contratistas", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM contratistas WHERE estado_activo = true ORDER BY id ASC"
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/contratistas/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "SELECT * FROM contratistas WHERE id = $1",
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Contratista no encontrado" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/contratistas", async (req, res) => {
  const { razon_social, rut } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO contratistas (razon_social, rut) VALUES ($1, $2) RETURNING *",
      [razon_social, rut]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/contratistas/:id", async (req, res) => {
  const { id } = req.params;
  const { razon_social, rut } = req.body;
  try {
    const result = await pool.query(
      "UPDATE contratistas SET razon_social = $1, rut = $2 WHERE id = $3 RETURNING *",
      [razon_social, rut, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Contratista no encontrado" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/contratistas/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query(
      "UPDATE contratistas SET estado_activo = false WHERE id = $1",
      [id]
    );
    res.json({ message: "Contratista eliminado lógicamente" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// ÁREAS
// ============================================

app.get("/api/areas", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT a.id, a.nombre, a.estado_activo, a.contratista_id, c.razon_social AS contratista_nombre 
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

app.get("/api/areas/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "SELECT * FROM areas WHERE id = $1",
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Área no encontrada" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/areas", async (req, res) => {
  const { contratista_id, nombre } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO areas (contratista_id, nombre) VALUES ($1, $2) RETURNING *",
      [contratista_id, nombre]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/areas/:id", async (req, res) => {
  const { id } = req.params;
  const { contratista_id, nombre } = req.body;
  try {
    const result = await pool.query(
      "UPDATE areas SET contratista_id = $1, nombre = $2 WHERE id = $3 RETURNING *",
      [contratista_id, nombre, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Área no encontrada" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/areas/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query(
      "UPDATE areas SET estado_activo = false WHERE id = $1",
      [id]
    );
    res.json({ message: "Área eliminada lógicamente" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// DISCIPLINAS
// ============================================

app.get("/api/disciplinas", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT d.id, d.nombre, d.estado_activo, d.area_id, a.nombre AS area_nombre 
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

app.get("/api/disciplinas/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "SELECT * FROM disciplinas WHERE id = $1",
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Disciplina no encontrada" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/disciplinas", async (req, res) => {
  const { area_id, nombre } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO disciplinas (area_id, nombre) VALUES ($1, $2) RETURNING *",
      [area_id, nombre]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/disciplinas/:id", async (req, res) => {
  const { id } = req.params;
  const { area_id, nombre } = req.body;
  try {
    const result = await pool.query(
      "UPDATE disciplinas SET area_id = $1, nombre = $2 WHERE id = $3 RETURNING *",
      [area_id, nombre, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Disciplina no encontrada" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/disciplinas/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query(
      "UPDATE disciplinas SET estado_activo = false WHERE id = $1",
      [id]
    );
    res.json({ message: "Disciplina eliminada lógicamente" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor ms-mantenedor corriendo en el puerto ${PORT}`);
});