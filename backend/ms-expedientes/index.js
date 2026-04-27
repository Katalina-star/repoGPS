const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
app.use(cors());
app.use(express.json());

// Compatibilidad de esquema: algunas BD antiguas usan etapa_proceso_id
let TAREAS_ETAPA_COLUMN = null;

async function resolveTareasEtapaColumn() {
  try {
    const result = await pool.query(
      `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'tareas_asignadas'
        AND column_name IN ('etapa_id', 'etapa_proceso_id')
      ORDER BY CASE column_name
        WHEN 'etapa_id' THEN 1
        WHEN 'etapa_proceso_id' THEN 2
        ELSE 99
      END
      LIMIT 1
      `
    );

    if (result.rows.length > 0) {
      TAREAS_ETAPA_COLUMN = result.rows[0].column_name;
      console.log(`[ms-expedientes] Usando columna de etapa en tareas_asignadas: ${TAREAS_ETAPA_COLUMN}`);
    } else {
      TAREAS_ETAPA_COLUMN = "etapa_id";
      console.warn("[ms-expedientes] No se encontró columna etapa_id ni etapa_proceso_id en tareas_asignadas. Se usará etapa_id por defecto.");
    }
  } catch (err) {
    // Puede fallar al iniciar si DB todavía no está lista. Reintentar en runtime.
    console.warn(`[ms-expedientes] No se pudo resolver columna de etapa al iniciar: ${err.message}. Se reintentará en runtime.`);
  }
}

async function getTareasEtapaColumn() {
  if (!TAREAS_ETAPA_COLUMN) {
    await resolveTareasEtapaColumn();
  }
  return TAREAS_ETAPA_COLUMN || "etapa_id";
}

function isMissingColumnError(err, colName) {
  const msg = (err && err.message) || "";
  return msg.includes(`column t.${colName} does not exist`) || msg.includes(`column ${colName} does not exist`);
}

const TIPOS_TAREA_VALIDOS = new Set(["revision", "aprobacion", "visacion"]);

function normalizarTipoTarea(tipo_tarea) {
  if (!tipo_tarea) return null;
  const normalizado = String(tipo_tarea).trim().toLowerCase();
  if (!TIPOS_TAREA_VALIDOS.has(normalizado)) {
    return null;
  }
  return normalizado;
}

async function validarReglasEtapa({ proceso_id, orden, es_final, tipo_tarea, rol_id }, etapaId = null) {
  const procesoIdNum = Number(proceso_id);
  const ordenNum = Number(orden);
  const rolIdNum = rol_id ? Number(rol_id) : null;

  if (!Number.isInteger(procesoIdNum) || procesoIdNum <= 0) {
    throw new Error("proceso_id inválido");
  }

  if (!Number.isInteger(ordenNum) || ordenNum <= 0) {
    throw new Error("orden debe ser un entero mayor a 0");
  }

  const tipoNormalizado = tipo_tarea ? normalizarTipoTarea(tipo_tarea) : null;
  if (tipo_tarea && !tipoNormalizado) {
    throw new Error("tipo_tarea inválido (use: revision, aprobacion o visacion)");
  }

  if ((tipoNormalizado && !rolIdNum) || (!tipoNormalizado && rolIdNum)) {
    throw new Error("tipo_tarea y rol_id deben enviarse juntos");
  }

  const procesoExiste = await pool.query(
    "SELECT id FROM procesos WHERE id = $1",
    [procesoIdNum]
  );
  if (procesoExiste.rows.length === 0) {
    throw new Error("Proceso no encontrado");
  }

  const ordenDuplicado = await pool.query(
    `SELECT id FROM etapas_proceso
     WHERE proceso_id = $1
       AND orden = $2
       AND estado_activo = true
       AND ($3::int IS NULL OR id <> $3)
     LIMIT 1`,
    [procesoIdNum, ordenNum, etapaId]
  );
  if (ordenDuplicado.rows.length > 0) {
    throw new Error("Ya existe una etapa activa con ese orden para el proceso");
  }

  if (Boolean(es_final)) {
    const finalExistente = await pool.query(
      `SELECT id FROM etapas_proceso
       WHERE proceso_id = $1
         AND es_final = true
         AND estado_activo = true
         AND ($2::int IS NULL OR id <> $2)
       LIMIT 1`,
      [procesoIdNum, etapaId]
    );
    if (finalExistente.rows.length > 0) {
      throw new Error("Ya existe una etapa final activa para este proceso");
    }
  }

  return {
    proceso_id: procesoIdNum,
    orden: ordenNum,
    es_final: Boolean(es_final),
    tipo_tarea: tipoNormalizado,
    rol_id: rolIdNum
  };
}

async function getTareaConEtapa(tareaId) {
  let etapaColumn = await getTareasEtapaColumn();
  const buildQuery = () => `
    SELECT t.id, t.usuario_id, t.estado, ep.rol_id
    FROM tareas_asignadas t
    INNER JOIN etapas_proceso ep ON t.${etapaColumn} = ep.id
    WHERE t.id = $1
    LIMIT 1
  `;

  try {
    const result = await pool.query(buildQuery(), [tareaId]);
    return result.rows[0] || null;
  } catch (err) {
    if (etapaColumn === "etapa_id" && isMissingColumnError(err, "etapa_id")) {
      etapaColumn = "etapa_proceso_id";
      TAREAS_ETAPA_COLUMN = etapaColumn;
      const result = await pool.query(buildQuery(), [tareaId]);
      return result.rows[0] || null;
    }
    if (etapaColumn === "etapa_proceso_id" && isMissingColumnError(err, "etapa_proceso_id")) {
      etapaColumn = "etapa_id";
      TAREAS_ETAPA_COLUMN = etapaColumn;
      const result = await pool.query(buildQuery(), [tareaId]);
      return result.rows[0] || null;
    }
    throw err;
  }
}

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
    const { area_id } = req.query;
    let query = "SELECT * FROM procesos WHERE estado_activo = true";
    let params = [];
    
    if (area_id && area_id !== undefined && area_id !== '') {
      query += " AND area_id = $1";
      params.push(Number(area_id));
    }
    
    query += " ORDER BY id ASC";
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint específico para procesos por área (evita query string)
app.get("/api/procesos-por-area/:areaId", async (req, res) => {
  const { areaId } = req.params;
  try {
    const result = await pool.query(
      "SELECT * FROM procesos WHERE area_id = $1 AND estado_activo = true ORDER BY id ASC",
      [Number(areaId)]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/procesos/area/:areaId", async (req, res) => {
  const { areaId } = req.params;
  try {
    const result = await pool.query(
      "SELECT * FROM procesos WHERE area_id = $1 AND estado_activo = true ORDER BY id ASC",
      [areaId]
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

app.patch("/api/procesos/:id/estado", async (req, res) => {
  const { id } = req.params;
  const { estado_activo } = req.body;
  try {
    const result = await pool.query(
      "UPDATE procesos SET estado_activo = $1 WHERE id = $2 RETURNING *",
      [Boolean(estado_activo), id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Proceso no encontrado" });
    }
    res.json(result.rows[0]);
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
  const { proceso_id, nombre, orden, es_final, tipo_tarea, rol_id } = req.body;
  try {
    const validado = await validarReglasEtapa({ proceso_id, orden, es_final, tipo_tarea, rol_id });
    const result = await pool.query(
      "INSERT INTO etapas_proceso (proceso_id, nombre, orden, es_final, tipo_tarea, rol_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [validado.proceso_id, nombre, validado.orden, validado.es_final, validado.tipo_tarea, validado.rol_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put("/api/etapas-proceso/:id", async (req, res) => {
  const { id } = req.params;
  const { proceso_id, nombre, orden, es_final, tipo_tarea, rol_id } = req.body;
  try {
    const validado = await validarReglasEtapa({ proceso_id, orden, es_final, tipo_tarea, rol_id }, Number(id));
    const result = await pool.query(
      "UPDATE etapas_proceso SET proceso_id = $1, nombre = $2, orden = $3, es_final = $4, tipo_tarea = $5, rol_id = $6 WHERE id = $7 RETURNING *",
      [validado.proceso_id, nombre, validado.orden, validado.es_final, validado.tipo_tarea, validado.rol_id, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Etapa no encontrada" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
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

app.patch("/api/etapas-proceso/:id/estado", async (req, res) => {
  const { id } = req.params;
  const { estado_activo } = req.body;
  try {
    const result = await pool.query(
      "UPDATE etapas_proceso SET estado_activo = $1 WHERE id = $2 RETURNING *",
      [Boolean(estado_activo), id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Etapa no encontrada" });
    }
    res.json(result.rows[0]);
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
  const { proceso_id, disciplina_id, subtipo_id, titulo, descripcion } = req.body;
  try {
    // Obtener la primera etapa del proceso para asignarla automáticamente
    const etapaResult = await pool.query(
      "SELECT id FROM etapas_proceso WHERE proceso_id = $1 AND estado_activo = true ORDER BY orden ASC LIMIT 1",
      [proceso_id]
    );
    
    const etapa_actual_id = etapaResult.rows[0]?.id || null;
    
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
      `UPDATE expedientes SET proceso_id = $1, disciplina_id = $2, subtipo_id = $3,
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
// Al avanzar, genera tareas automaticamente para usuarios con el rol correspondiente
app.post("/api/expedientes/:id/avanzar", async (req, res) => {
  const { id } = req.params;
  const { usuario_id, observacion, rol_id } = req.body;

  if (!usuario_id) {
    return res.status(400).json({ error: "usuario_id es requerido" });
  }

  // HU-02: Colaborador no puede avanzar expediente
  // Rol 4 = Colaborador (init.sql)
  if (Number(rol_id) === 4) {
    return res.status(403).json({ error: "Colaborador no puede avanzar expedientes" });
  }
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
      return res.status(400).json({ error: "No hay mas etapas para avanzar" });
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
      [id, expediente.etapa_actual_id, nuevaEtapa.id, usuario_id, observacion || "Avance automatico"]
    );

    // Generar tareas automaticamente para la nueva etapa
    if (nuevaEtapa.tipo_tarea && nuevaEtapa.rol_id) {
      await generarTareasPorEtapa(id, nuevaEtapa.id, pool);
    }

    res.json({ message: "Expediente avanzado", nueva_etapa: nuevaEtapa });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Devolver expediente a etapa anterior
app.post("/api/expedientes/:id/devolver", async (req, res) => {
  const { id } = req.params;
  const { usuario_id, observacion, rol_id } = req.body;

  if (!usuario_id) {
    return res.status(400).json({ error: "usuario_id es requerido" });
  }

  // HU-02: Colaborador no puede devolver/rechazar expediente
  // Rol 4 = Colaborador (init.sql)
  if (Number(rol_id) === 4) {
    return res.status(403).json({ error: "Colaborador no puede devolver expedientes" });
  }
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

// Obtener tareas de un usuario filtradas por area y rol
// GET /api/tareas/mis-tareas?usuario_id=X&area_id=Y&rol_id=Z
app.get("/api/tareas/mis-tareas", async (req, res) => {
  const { usuario_id, area_id, rol_id } = req.query;

  if (!usuario_id) {
    return res.status(400).json({ error: "usuario_id es requerido" });
  }

  try {
    let etapaColumn = await getTareasEtapaColumn();
    const buildQuery = () => `
      SELECT DISTINCT ON (t.id)
        t.*,
        e.titulo AS expediente_titulo,
        e.fecha_creacion AS expediente_fecha,
        p.nombre AS proceso_nombre,
        p.area_id,
        ep.nombre AS etapa_nombre,
        ep.tipo_tarea
      FROM tareas_asignadas t
      INNER JOIN expedientes e ON t.expediente_id = e.id
      INNER JOIN procesos p ON e.proceso_id = p.id
      INNER JOIN etapas_proceso ep ON t.${etapaColumn} = ep.id
      WHERE t.usuario_id = $1
        AND t.estado IN ('pendiente', 'visto')
        AND e.estado_activo = true
        ${area_id ? 'AND p.area_id = $2' : ''}
        ${rol_id ? 'AND ep.rol_id = $3' : ''}
      ORDER BY t.id, t.fecha_asignacion ASC
    `;

    const params = area_id && rol_id ? [usuario_id, area_id, rol_id] : [usuario_id];

    let result;
    try {
      result = await pool.query(buildQuery(), params);
    } catch (err) {
      // fallback en caliente por drift de esquema en prod
      if (etapaColumn === "etapa_id" && isMissingColumnError(err, "etapa_id")) {
        etapaColumn = "etapa_proceso_id";
        TAREAS_ETAPA_COLUMN = etapaColumn;
        result = await pool.query(buildQuery(), params);
      } else if (etapaColumn === "etapa_proceso_id" && isMissingColumnError(err, "etapa_proceso_id")) {
        etapaColumn = "etapa_id";
        TAREAS_ETAPA_COLUMN = etapaColumn;
        result = await pool.query(buildQuery(), params);
      } else {
        throw err;
      }
    }

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obtener tareas por rol y area (para bandeja)
app.get("/api/tareas/bandeja", async (req, res) => {
  const { area_id, rol_id } = req.query;

  if (!area_id || !rol_id) {
    return res.status(400).json({ error: "area_id y rol_id son requeridos" });
  }

  try {
    let etapaColumn = await getTareasEtapaColumn();
    const buildQuery = () => `
      SELECT DISTINCT ON (t.id)
        t.*,
        e.titulo AS expediente_titulo,
        e.fecha_creacion AS expediente_fecha,
        p.nombre AS proceso_nombre,
        p.area_id,
        ep.nombre AS etapa_nombre,
        ep.tipo_tarea,
        u.nombre_completo AS usuario_nombre,
        u.correo AS usuario_correo
      FROM tareas_asignadas t
      INNER JOIN expedientes e ON t.expediente_id = e.id
      INNER JOIN procesos p ON e.proceso_id = p.id
      INNER JOIN etapas_proceso ep ON t.${etapaColumn} = ep.id
      INNER JOIN db_usuarios.usuarios u ON t.usuario_id = u.id
      WHERE p.area_id = $1
        AND ep.rol_id = $2
        AND t.estado IN ('pendiente', 'visto')
        AND e.estado_activo = true
      ORDER BY t.id, t.fecha_asignacion ASC
    `;

    let result;
    try {
      result = await pool.query(buildQuery(), [area_id, rol_id]);
    } catch (err) {
      if (etapaColumn === "etapa_id" && isMissingColumnError(err, "etapa_id")) {
        etapaColumn = "etapa_proceso_id";
        TAREAS_ETAPA_COLUMN = etapaColumn;
        result = await pool.query(buildQuery(), [area_id, rol_id]);
      } else if (etapaColumn === "etapa_proceso_id" && isMissingColumnError(err, "etapa_proceso_id")) {
        etapaColumn = "etapa_id";
        TAREAS_ETAPA_COLUMN = etapaColumn;
        result = await pool.query(buildQuery(), [area_id, rol_id]);
      } else {
        throw err;
      }
    }

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Marcar tarea como vista
app.patch("/api/tareas/:id/visto", async (req, res) => {
  const { id } = req.params;
  const { usuario_id, rol_id } = req.body || {};

  if (!usuario_id) {
    return res.status(400).json({ error: "usuario_id es requerido" });
  }

  try {
    const tarea = await getTareaConEtapa(id);
    if (!tarea) {
      return res.status(404).json({ error: "Tarea no encontrada" });
    }

    if (Number(tarea.usuario_id) !== Number(usuario_id)) {
      return res.status(403).json({ error: "No autorizado para esta tarea" });
    }

    if (rol_id && tarea.rol_id && Number(rol_id) !== Number(tarea.rol_id)) {
      return res.status(403).json({ error: "Rol no autorizado para esta tarea" });
    }

    if (['completada', 'rechazada'].includes(tarea.estado)) {
      return res.status(400).json({ error: "La tarea ya fue cerrada" });
    }

    const result = await pool.query(
      "UPDATE tareas_asignadas SET estado = 'visto', fecha_visto = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *",
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Tarea no encontrada" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Actualizar estado de tarea (completada/rechazada)
app.patch("/api/tareas/:id", async (req, res) => {
  const { id } = req.params;
  const { estado, observacion, usuario_id, rol_id } = req.body || {};

  if (!usuario_id) {
    return res.status(400).json({ error: "usuario_id es requerido" });
  }

  if (!['completada', 'rechazada'].includes(estado)) {
    return res.status(400).json({ error: "estado inválido" });
  }

  if (estado === 'rechazada' && !String(observacion || '').trim()) {
    return res.status(400).json({ error: "observacion es requerida para rechazar" });
  }

  try {
    const tarea = await getTareaConEtapa(id);
    if (!tarea) {
      return res.status(404).json({ error: "Tarea no encontrada" });
    }

    if (Number(tarea.usuario_id) !== Number(usuario_id)) {
      return res.status(403).json({ error: "No autorizado para esta tarea" });
    }

    if (rol_id && tarea.rol_id && Number(rol_id) !== Number(tarea.rol_id)) {
      return res.status(403).json({ error: "Rol no autorizado para esta tarea" });
    }

    if (['completada', 'rechazada'].includes(tarea.estado)) {
      return res.status(400).json({ error: "La tarea ya fue cerrada" });
    }

    const result = await pool.query(`
      UPDATE tareas_asignadas 
      SET estado = $1, 
          fecha_termino = CASE WHEN $1 IN ('completada', 'rechazada') THEN CURRENT_TIMESTAMP ELSE fecha_termino END,
          observacion = COALESCE($2, observacion)
      WHERE id = $3 
      RETURNING *
    `, [estado, observacion, id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Tarea no encontrada" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generar tareas automaticamente al cambiar de etapa
// Busca usuarios por rol+area y crea tareas_asignadas
async function generarTareasPorEtapa(expedienteId, etapaId, pool) {
  const etapaColumn = await getTareasEtapaColumn();
  // Obtener la etapa para saber que rol requiere
  const etapaResult = await pool.query(
    "SELECT * FROM etapas_proceso WHERE id = $1",
    [etapaId]
  );

  if (etapaResult.rows.length === 0) return;

  const etapa = etapaResult.rows[0];

  // Si la etapa no tiene tipo_tarea ni rol_id, no generar tareas
  if (!etapa.tipo_tarea || !etapa.rol_id) return;

  // Obtener info del expediente para saber el area
  const expResult = await pool.query(`
    SELECT e.*, p.area_id 
    FROM expedientes e 
    INNER JOIN procesos p ON e.proceso_id = p.id 
    WHERE e.id = $1
  `, [expedienteId]);

  if (expResult.rows.length === 0) return;

  const { area_id } = expResult.rows[0];

  // Buscar usuarios de esa area con ese rol
  // Conectar a db_usuarios para buscar
  const usuariosDb = new (require('pg').Pool)({
    user: process.env.DB_USER || "postgres",
    host: process.env.DB_HOST || "db",
    database: process.env.DB_NAME_USUARIOS || "db_usuarios",
    password: process.env.DB_PASSWORD || "password123",
    port: process.env.DB_PORT || 5432,
  });

  try {
    // Buscar usuarios del area con el rol especificado
    const usuariosResult = await usuariosDb.query(`
      SELECT u.id 
      FROM db_usuarios.usuarios u
      INNER JOIN db_usuarios.usuario_area ua ON u.id = ua.usuario_id
      WHERE ua.area_id = $1 AND u.rol_id = $2 AND u.estado_activo = true
    `, [area_id, etapa.rol_id]);

    // Crear tarea para cada usuario
    for (const usuario of usuariosResult.rows) {
      // Verificar si ya existe una tarea similar
      const existe = await pool.query(`
        SELECT id FROM tareas_asignadas 
        WHERE expediente_id = $1 AND ${etapaColumn} = $2 AND usuario_id = $3
      `, [expedienteId, etapaId, usuario.id]);

      if (existe.rows.length === 0) {
        await pool.query(`
          INSERT INTO tareas_asignadas (expediente_id, ${etapaColumn}, usuario_id, tipo_tarea, estado)
          VALUES ($1, $2, $3, $4, 'pendiente')
        `, [expedienteId, etapaId, usuario.id, etapa.tipo_tarea]);
      }
    }
  } finally {
    await usuariosDb.end();
  }
}

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
resolveTareasEtapaColumn().finally(() => {
  app.listen(PORT, () => {
    console.log(`Servidor ms-expedientes corriendo en el puerto ${PORT}`);
  });
});
