// server/routes/equipment.js
const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/equipment/categories
router.get('/categories', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, slug, label FROM equipment_categories ORDER BY id');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// GET /api/equipment/items
router.get('/items', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT ei.id, ei.category_id, ei.item_key, ei.label
       FROM equipment_items ei
       ORDER BY ei.category_id, ei.id`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// GET /api/equipment - wszystkie sprzêty z przegl¹dem i ubezpieczeniem
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT 
         id,
         name,
         category_id,
         operational_number,
         purchase_date,
         next_inspection,
         insurance_expiry,
         status
       FROM station_equipment
       ORDER BY name ASC`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// GET /api/equipment/:id - szczegó³y sprzêtu
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT 
         id,
         name,
         category_id,
         operational_number,
         purchase_date,
         next_inspection,
         insurance_expiry,
         status,
         last_inspection_date
       FROM station_equipment
       WHERE id = ?`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Equipment not found' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// POST /api/equipment - dodaj sprzêt
router.post('/', async (req, res) => {
  try {
    const { name, category_id, operational_number, purchase_date, next_inspection, insurance_expiry, status } = req.body;

    const [result] = await pool.query(
      `INSERT INTO station_equipment (name, category_id, operational_number, purchase_date, next_inspection, insurance_expiry, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, category_id, operational_number, purchase_date, next_inspection, insurance_expiry, status || 'active']
    );

    res.status(201).json({
      id: result.insertId,
      name,
      category_id,
      operational_number,
      purchase_date,
      next_inspection,
      insurance_expiry,
      status: status || 'active',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// PUT /api/equipment/:id - aktualizuj sprzêt
router.put('/:id', async (req, res) => {
  try {
    const { name, category_id, operational_number, purchase_date, next_inspection, insurance_expiry, status } = req.body;

    const [result] = await pool.query(
      `UPDATE station_equipment 
       SET name = ?, category_id = ?, operational_number = ?, purchase_date = ?, next_inspection = ?, insurance_expiry = ?, status = ?
       WHERE id = ?`,
      [name, category_id, operational_number, purchase_date, next_inspection, insurance_expiry, status, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Equipment not found' });
    }

    res.json({ message: 'Equipment updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// DELETE /api/equipment/:id - usuñ sprzêt
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM station_equipment WHERE id = ?', [req.params.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Equipment not found' });
    }

    res.json({ message: 'Equipment deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;