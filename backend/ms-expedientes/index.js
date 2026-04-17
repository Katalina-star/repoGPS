const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
app.use(cors());
app.use(express.json());

// Conexión a db_expedientes
const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "db_expedientes",
  database: process.env.DB_NAME || "db_expedientes",
  password: process.env.DB_PASSWORD || "password123",
  port: process.env.DB_PORT || 5432,
});

// ============================================
// PROCESOS
// ============================================

app.get("/api/procesos", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM procesos WHERE estado_activo = true ORDER BY id ASC"
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/procesos/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("SELECT * FROM procesos WHERE id = $1", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Proceso no encontrado" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/procesos", async (req, res) => {
  const { area_id, nombre, descripcion } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO procesos (area_id, nombre, descripcion) VALUES ($1, $2, $3) RETURNING *",
      [area_id, nombre, descripcion]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/procesos/:id", async (req, res) => {
  const { id } = req.params;
  const { area_id, nombre, descripcion } = req.body;
  try {
    const result = await pool.query(
      "UPDATE procesos SET area_id = $1, nombre = $2, descripcion = $3 WHERE id = $4 RETURNING *",
      [area_id, nombre, descripcion, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Proceso no encontrado" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/procesos/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("UPDATE procesos SET estado_activo = false WHERE id = $1", [id]);
    res.json({ message: "Proceso eliminado lógicamente" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// ETAPAS PROCESO
// ============================================

app.get("/api/etapas-proceso", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM etapas_proceso WHERE estado_activo = true ORDER BY proceso_id, orden ASC"
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/etapas-proceso/proceso/:procesoId", async (req, res) => {
  const { procesoId } = req.params;
  try {
    const result = await pool.query(
      "SELECT * FROM etapas_proceso WHERE proceso_id = $1 AND estado_activo = true ORDER BY orden ASC",
      [procesoId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/etapas-proceso/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("SELECT * FROM etapas_proceso WHERE id = $1", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Etapa no encontrada" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/etapas-proceso", async (req, res) => {
  const { proceso_id, nombre, orden, es_final } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO etapas_proceso (proceso_id, nombre, orden, es_final) VALUES ($1, $2, $3, $4) RETURNING *",
      [proceso_id, nombre, orden, es_final || false]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/etapas-proceso/:id", async (req, res) => {
  const { id } = req.params;
  const { proceso_id, nombre, orden, es_final } = req.body;
  try {
    const result = await pool.query(
      "UPDATE etapas_proceso SET proceso_id = $1, nombre = $2, orden = $3, es_final = $4 WHERE id = $5 RETURNING *",
      [proceso_id, nombre, orden, es_final, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Etapa no encontrada" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/etapas-proceso/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("UPDATE etapas_proceso SET estado_activo = false WHERE id = $1", [id]);
    res.json({ message: "Etapa eliminada lógicamente" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// EXPEDIENTES
// ============================================

app.get("/api/expedientes", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT e.*, p.nombre AS proceso_nombre, ep.nombre AS etapa_actual
      FROM expedientes e
      LEFT JOIN procesos p ON e.proceso_id = p.id
      LEFT JOIN etapas_proceso ep ON e.etapa_actual_id = ep.id
      WHERE e.estado_activo = true
      ORDER BY e.fecha_creacion DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/expedientes/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("SELECT * FROM expedientes WHERE id = $1", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Expediente no encontrado" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/expedientes", async (req, res) => {
  const { proceso_id, disciplina_id, subtipo_id, etapa_actual_id, titulo, descripcion } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO expedientes (proceso_id, disciplina_id, subtipo_id, etapa_actual_id, titulo, descripcion)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [proceso_id, disciplina_id, subtipo_id, etapa_actual_id, titulo, descripcion]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/expedientes/:id", async (req, res) => {
  const { id } = req.params;
  const { proceso_id, disciplina_id, subtipo_id, etapa_actual_id, titulo, descripcion } = req.body;
  try {
    const result = await pool.query(
      `UPDATE expediente SET proceso_id = $1, disciplina_id = $2, subtipo_id = $3,
       etapa_actual_id = $4, titulo = $5, descripcion = $6, fecha_actualizacion = CURRENT_TIMESTAMP
       WHERE id = $7 RETURNING *`,
      [proceso_id, disciplina_id, subtipo_id, etapa_actual_id, titulo, descripcion, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Expediente no encontrado" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Avanzar expediente a siguiente etapa
app.post("/api/expedientes/:id/avanzar", async (req, res) => {
  const { id } = req.params;
  const { usuario_id, observacion } = req.body;
  try {
    // Obtener expediente actual
    const expResult = await pool.query("SELECT * FROM expedientes WHERE id = $1", [id]);
    if (expResult.rows.length === 0) {
      return res.status(404).json({ error: "Expediente no encontrado" });
    }
    const expediente = expResult.rows[0];

    // Obtener siguiente etapa
    const etapaResult = await pool.query(
      "SELECT * FROM etapas_proceso WHERE proceso_id = $1 AND orden > (SELECT orden FROM etapas_proceso WHERE id = $2) ORDER BY orden ASC LIMIT 1",
      [expediente.proceso_id, expediente.etapa_actual_id]
    );

    if (etapaResult.rows.length === 0) {
      return res.status(400).json({ error: "No hay más etapas para avanzar" });
    }

    const nuevaEtapa = etapaResult.rows[0];

    // Actualizar expediente
    await pool.query(
      "UPDATE expedientes SET etapa_actual_id = $1, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = $2",
      [nuevaEtapa.id, id]
    );

    // Registrar en historial
    await pool.query(
      "INSERT INTO historial_etapas (expediente_id, etapa_anterior_id, etapa_nueva_id, usuario_id, observacion) VALUES ($1, $2, $3, $4, $5)",
      [id, expediente.etapa_actual_id, nuevaEtapa.id, usuario_id, observacion || "Avance automático"]
    );

    res.json({ message: "Expediente avanzado", nueva_etapa: nuevaEtapa });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Devolver expediente a etapa anterior
app.post("/api/expedientes/:id/devolver", async (req, res) => {
  const { id } = req.params;
  const { usuario_id, observacion } = req.body;
  try {
    const expResult = await pool.query("SELECT * FROM expedientes WHERE id = $1", [id]);
    if (expResult.rows.length === 0) {
      return res.status(404).json({ error: "Expediente no encontrado" });
    }
    const expediente = expResult.rows[0];

    const etapaResult = await pool.query(
      "SELECT * FROM etapas_proceso WHERE proceso_id = $1 AND orden < (SELECT orden FROM etapas_proceso WHERE id = $2) ORDER BY orden DESC LIMIT 1",
      [expediente.proceso_id, expediente.etapa_actual_id]
    );

    if (etapaResult.rows.length === 0) {
      return res.status(400).json({ error: "No hay etapas anteriores" });
    }

    const etapaAnterior = etapaResult.rows[0];

    await pool.query(
      "UPDATE expedientes SET etapa_actual_id = $1, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = $2",
      [etapaAnterior.id, id]
    );

    await pool.query(
      "INSERT INTO historial_etapas (expediente_id, etapa_anterior_id, etapa_nueva_id, usuario_id, observacion) VALUES ($1, $2, $3, $4, $5)",
      [id, expediente.etapa_actual_id, etapaAnterior.id, usuario_id, observacion || "Devolución"]
    );

    res.json({ message: "Expediente devuelto", etapa_anterior: etapaAnterior });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/expedientes/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("UPDATE expedientes SET estado_activo = false WHERE id = $1", [id]);
    res.json({ message: "Expediente eliminado lógicamente" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// DOCUMENTOS
// ============================================

app.get("/api/documentos/expediente/:expedienteId", async (req, res) => {
  const { expedienteId } = req.params;
  try {
    const result = await pool.query(
      "SELECT * FROM documentos WHERE expediente_id = $1 AND estado_activo = true ORDER BY fecha_upload DESC",
      [expedienteId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/documentos/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("SELECT * FROM documentos WHERE id = $1", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Documento no encontrado" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/documentos", async (req, res) => {
  const { expediente_id, nombre_archivo, ruta_archivo, tipo_mime, tamano_bytes } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO documentos (expediente_id, nombre_archivo, ruta_archivo, tipo_mime, tamano_bytes) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [expediente_id, nombre_archivo, ruta_archivo, tipo_mime, tamano_bytes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/documentos/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("UPDATE documentos SET estado_activo = false WHERE id = $1", [id]);
    res.json({ message: "Documento eliminado lógicamente" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// HISTORIAL ETAPAS
// ============================================

app.get("/api/historial/expediente/:expedienteId", async (req, res) => {
  const { expedienteId } = req.params;
  try {
    const result = await pool.query(`
      SELECT h.*, 
             ea.nombre AS etapa_anterior_nombre, 
             en.nombre AS etapa_nueva_nombre,
             u.nombre AS usuario_nombre
      FROM historial_etapas h
      LEFT JOIN etapas_proceso ea ON h.etapa_anterior_id = ea.id
      LEFT JOIN etapas_proceso en ON h.etapa_nueva_id = en.id
      LEFT JOIN usuarios u ON h.usuario_id = u.id
      WHERE h.expediente_id = $1
      ORDER BY h.fecha_cambio DESC
    `, [expedienteId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// TAREAS ASIGNADAS
// ============================================

app.get("/api/tareas", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT t.*, e.titulo AS expediente_titulo, u.nombre AS usuario_nombre
      FROM tareas_asignadas t
      LEFT JOIN expedientes e ON t.expediente_id = e.id
      LEFT JOIN usuarios u ON t.usuario_id = u.id
      ORDER BY t.fecha_asignacion DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/tareas/usuario/:usuarioId", async (req, res) => {
  const { usuarioId } = req.params;
  try {
    const result = await pool.query(
      "SELECT * FROM tareas_asignadas WHERE usuario_id = $1 AND estado = 'pendiente' ORDER BY fecha_asignacion ASC",
      [usuarioId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/tareas", async (req, res) => {
  const { expediente_id, usuario_id, tipo_tarea, observacion } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO tareas_asignadas (expediente_id, usuario_id, tipo_tarea, observacion) VALUES ($1, $2, $3, $4) RETURNING *",
      [expediente_id, usuario_id, tipo_tarea, observacion]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/tareas/:id", async (req, res) => {
  const { id } = req.params;
  const { estado, observacion } = req.body;
  try {
    const result = await pool.query(
      "UPDATE tareas_asignadas SET estado = $1, fecha_termino = CASE WHEN $1 = 'completada' THEN CURRENT_TIMESTAMP ELSE fecha_termino END, observacion = COALESCE($2, observacion) WHERE id = $3 RETURNING *",
      [estado, observacion, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Tarea no encontrada" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// CATEGORÍAS Y SUBTIPOS (Desde db_mantenedores - API Composition)
// ============================================

app.get("/api/categorias", async (req, res) => {
  try {
    // Obtener desde ms-mantenedor (API Composition)
    const response = await fetch(`${process.env.MS_MANTENEDOR_URL || 'http://ms-mantenedor:3001'}/api/categorias`);
    if (!response.ok) throw new Error("Error al obtener categorías");
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/subtipos", async (req, res) => {
  try {
    const response = await fetch(`${process.env.MS_MANTENEDOR_URL || 'http://ms-mantenedor:3001'}/api/subtipos`);
    if (!response.ok) throw new Error("Error al obtener subtipos");
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Servidor
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Servidor ms-expedientes corriendo en el puerto ${PORT}`);
});