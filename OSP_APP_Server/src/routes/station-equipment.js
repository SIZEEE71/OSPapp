const express = require('express');
const pool = require('../db');

const router = express.Router();

// GET all station equipment
router.get('/', async (req, res) => {
  try {
    const { station_name } = req.query;
    
    let query = 'SELECT * FROM station_equipment';
    let params = [];
    
    if (station_name) {
      query += ' WHERE station_name = ?';
      params.push(station_name);
    }
    
    query += ' ORDER BY category_slug, name ASC';
    
    const [equipment] = await pool.query(query, params);
    res.json(equipment);
  } catch (error) {
    console.error('Error fetching equipment:', error);
    res.status(500).json({ error: 'Failed to fetch equipment' });
  }
});

// GET equipment by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [equipment] = await pool.query(
      'SELECT * FROM station_equipment WHERE id = ?',
      [id]
    );

    if (equipment.length === 0) {
      return res.status(404).json({ error: 'Equipment not found' });
    }

    res.json(equipment[0]);
  } catch (error) {
    console.error('Error fetching equipment:', error);
    res.status(500).json({ error: 'Failed to fetch equipment' });
  }
});

// POST new equipment
router.post('/', async (req, res) => {
  try {
    const {
      name,
      category_slug,
      quantity,
      location,
      equipment_type,
      parameters,
      production_year,
      description,
      last_inspection_date,
      next_inspection_date,
      station_name,
    } = req.body;

    if (!name || !category_slug) {
      return res.status(400).json({ error: 'name and category_slug required' });
    }

    const [result] = await pool.query(
      `INSERT INTO station_equipment (
        name, category_slug, quantity, location, equipment_type,
        parameters, production_year, description, last_inspection_date, next_inspection_date, station_name
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        category_slug,
        quantity || 1,
        location || null,
        equipment_type || null,
        parameters ? JSON.stringify(parameters) : null,
        production_year || null,
        description || null,
        last_inspection_date || null,
        next_inspection_date || null,
        station_name || null,
      ]
    );

    res.status(201).json({ id: result.insertId, ...req.body });
  } catch (error) {
    console.error('Error creating equipment:', error);
    res.status(500).json({ error: 'Failed to create equipment' });
  }
});

// PUT update equipment
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const allowedFields = [
      'name', 'category_slug', 'quantity', 'location', 'equipment_type',
      'parameters', 'production_year', 'description', 'last_inspection_date', 'next_inspection_date', 'station_name'
    ];

    const fields = Object.keys(updates).filter(key => allowedFields.includes(key));
    
    if (fields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => {
      if (field === 'parameters' && typeof updates[field] === 'object') {
        return JSON.stringify(updates[field]);
      }
      return updates[field];
    });
    values.push(id);

    await pool.query(
      `UPDATE station_equipment SET ${setClause} WHERE id = ?`,
      values
    );

    res.json({ id, ...updates });
  } catch (error) {
    console.error('Error updating equipment:', error);
    res.status(500).json({ error: 'Failed to update equipment' });
  }
});

// DELETE equipment
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query(
      'DELETE FROM station_equipment WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Equipment not found' });
    }

    res.json({ message: 'Equipment deleted successfully' });
  } catch (error) {
    console.error('Error deleting equipment:', error);
    res.status(500).json({ error: 'Failed to delete equipment' });
  }
});

module.exports = router;
