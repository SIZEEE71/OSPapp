// server/routes/firefighters.js
const express = require('express');
const router = express.Router();
const pool = require('../db');

// Normalize phone number - remove +48, 0048, leading 0 and keep only digits
function normalizePhoneNumber(phone) {
  if (!phone) return null;
  
  // Remove all non-digits except leading +
  let normalized = phone.replace(/[^\d+]/g, '');
  
  // Remove leading +
  if (normalized.startsWith('+')) {
    normalized = normalized.substring(1);
  }
  
  // Remove leading country code +48 or 0048
  if (normalized.startsWith('48')) {
    normalized = normalized.substring(2);
  }
  
  // Remove leading 0
  if (normalized.startsWith('0')) {
    normalized = normalized.substring(1);
  }
  
  return normalized;
}

// GET /api/firefighters - list all
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, name, phone_number, created_at FROM firefighters ORDER BY id DESC');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// GET /api/firefighters/phone/:phone_number - find by phone number
router.get('/phone/:phone_number', async (req, res) => {
  try {
    const phoneNumber = req.params.phone_number;
    const normalized = normalizePhoneNumber(phoneNumber);
  
    
    // Search with LIKE to handle both formats (with/without country code)
    const [rows] = await pool.query(
      'SELECT id, name, phone_number FROM firefighters WHERE phone_number LIKE ? OR phone_number LIKE ? LIMIT 1',
      [`%${normalized}`, `${normalized}%`]
    );
    
    if (rows.length === 0) {
      console.log('Phone not found in database');
      return res.status(404).json({ error: 'Firefighter not found' });
    }
    
    console.log('Found firefighter:', rows[0].name);
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// POST /api/firefighters - add new firefighter
router.post('/', async (req, res) => {
  try {
    const { name, phone_number } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });
    const [result] = await pool.query(
      'INSERT INTO firefighters (name, phone_number) VALUES (?, ?)',
      [name, phone_number || null]
    );
    res.json({ id: result.insertId, name, phone_number: phone_number || null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

/*
  GET /api/firefighters/:id/equipment
  Returns the full catalog with any assigned values for the firefighter (LEFT JOIN).
*/
router.get('/:id/equipment', async (req, res) => {
  const firefighterId = parseInt(req.params.id, 10);
  if (Number.isNaN(firefighterId)) return res.status(400).json({ error: 'invalid id' });

  try {
    const [rows] = await pool.query(
      `SELECT
         ec.slug as category_slug,
         ec.label as category_label,
         ei.item_key,
         ei.label as item_label,
         fe.selected,
         fe.quantity,
         fe.condition,
         fe.notes
       FROM equipment_items ei
       JOIN equipment_categories ec ON ec.id = ei.category_id
       LEFT JOIN firefighter_equipment fe
         ON fe.equipment_item_id = ei.id AND fe.firefighter_id = ?
       ORDER BY ec.id, ei.id`,
      [firefighterId]
    );
    res.json({ firefighterId, items: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

/*
  POST /api/firefighters/:id/equipment
  Body: { items: [ { item_key, selected, quantity, condition, notes } ] }
  Behaviour: bulk upsert items for this firefighter.
*/
router.post('/:id/equipment', async (req, res) => {
  const firefighterId = parseInt(req.params.id, 10);
  if (Number.isNaN(firefighterId)) return res.status(400).json({ error: 'invalid id' });

  const { items } = req.body;
  if (!Array.isArray(items)) return res.status(400).json({ error: 'items array required' });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    for (const it of items) {
      const { item_key, selected = 0, quantity = 0, condition = 'Dobry', notes = '' } = it;

      // find equipment_item id
      const [itemRows] = await conn.query('SELECT id FROM equipment_items WHERE item_key = ? LIMIT 1', [item_key]);
      if (!itemRows || itemRows.length === 0) {
        // unknown item_key -> rollback and return error (you can change to skip instead)
        await conn.rollback();
        return res.status(400).json({ error: `Unknown item_key: ${item_key}` });
      }
      const equipmentItemId = itemRows[0].id;

      // upsert into firefighter_equipment
      await conn.query(
        `INSERT INTO firefighter_equipment
           (firefighter_id, equipment_item_id, selected, quantity, \`condition\`, notes)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           selected = VALUES(selected),
           quantity = VALUES(quantity),
           \`condition\` = VALUES(\`condition\`),
           notes = VALUES(notes),
           updated_at = CURRENT_TIMESTAMP`,
        [firefighterId, equipmentItemId, selected ? 1 : 0, quantity, condition, notes]
      );
    }

    await conn.commit();

    // return updated list for the firefighter
    const [rows] = await pool.query(
      `SELECT
         ei.item_key, ei.label as item_label, fe.selected, fe.quantity, fe.\`condition\`, fe.notes
       FROM firefighter_equipment fe
       JOIN equipment_items ei ON ei.id = fe.equipment_item_id
       WHERE fe.firefighter_id = ?`,
      [firefighterId]
    );

    res.json({ firefighterId, items: rows });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  } finally {
    conn.release();
  }
});

module.exports = router;