const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'db_usuarios',
  password: 'password123',
  port: 5433,
});

app.get('/api/roles', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM roles WHERE estado_activo = true');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/usuarios', async (req, res) => {
  const { rol_id, nombre_completo, correo, password_hash } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO usuarios (rol_id, nombre_completo, correo, password_hash) VALUES ($1, $2, $3, $4) RETURNING *',
      [rol_id, nombre_completo, correo, password_hash]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(3000, () => {
  console.log('Servidor Backend corriendo en el puerto 3000');
});