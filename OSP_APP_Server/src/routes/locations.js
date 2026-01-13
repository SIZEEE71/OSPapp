// src/routes/locations.js
// Express router for location endpoints using MySQL (mysql2/promise)
// Mount this router under e.g. '/api/location'

const express = require('express');
const router = express.Router();
// reuse centralized pool from src/db.js
const pool = require('../db');

// Helper to validate numbers
function isNumber(n) {
  return typeof n === 'number' && Number.isFinite(n);
}

// POST /update
// Body: { firefighter_id: number, lat: number, lng: number, label?: string }
router.post('/update', async (req, res) => {
  const { firefighter_id, lat, lng, label } = req.body;
  if (!firefighter_id || !isNumber(lat) || !isNumber(lng)) {
    return res.status(400).json({ error: 'Missing or invalid fields. Expect firefighter_id, lat, lng' });
  }

  const conn = await pool.getConnection();
  try {
    const upsertSql = `
      INSERT INTO latest_locations (firefighter_id, lat, lng, label)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        lat = VALUES(lat),
        lng = VALUES(lng),
        label = VALUES(label),
        updated_at = CURRENT_TIMESTAMP
    `;
    await conn.execute(upsertSql, [firefighter_id, lat, lng, label || null]);

    return res.json({ success: true });
  } catch (err) {
    console.error('location update error', err);
    return res.status(500).json({ error: 'db error' });
  } finally {
    conn.release();
  }
});

// GET /latest/:id -> latest for single firefighter
router.get('/latest/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: 'invalid id' });

  try {
    const [rows] = await pool.execute(
      'SELECT firefighter_id, lat, lng, label, updated_at FROM latest_locations WHERE firefighter_id = ?',
      [id]
    );
    if (!rows.length) return res.status(404).json({ error: 'not found' });
    return res.json(rows[0]);
  } catch (err) {
    console.error('get latest error', err);
    return res.status(500).json({ error: 'db error' });
  }
});

// GET /all -> all latest locations
router.get('/all', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT firefighter_id, lat, lng, label, updated_at FROM latest_locations');
    return res.json(rows);
  } catch (err) {
    console.error('get all error', err);
    return res.status(500).json({ error: 'db error' });
  }
});

module.exports = router;
