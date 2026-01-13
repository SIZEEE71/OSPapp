const express = require('express');
const pool = require('../db');

const router = express.Router();

// GET all medical items
router.get('/', async (req, res) => {
  try {
    const [items] = await pool.query(
      'SELECT * FROM medical_items ORDER BY expiry_date ASC, name ASC'
    );
    res.json(items);
  } catch (error) {
    console.error('Error fetching medical items:', error);
    res.status(500).json({ error: 'Failed to fetch medical items' });
  }
});

// GET medical item by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [items] = await pool.query(
      'SELECT * FROM medical_items WHERE id = ?',
      [id]
    );

    if (items.length === 0) {
      return res.status(404).json({ error: 'Medical item not found' });
    }

    res.json(items[0]);
  } catch (error) {
    console.error('Error fetching medical item:', error);
    res.status(500).json({ error: 'Failed to fetch medical item' });
  }
});

// POST new medical item
router.post('/', async (req, res) => {
  try {
    const { name, quantity, expiry_date, description } = req.body;

    if (!name || !quantity) {
      return res.status(400).json({ error: 'name and quantity are required' });
    }

    const [result] = await pool.query(
      `INSERT INTO medical_items (name, quantity, expiry_date, description)
       VALUES (?, ?, ?, ?)`,
      [name, parseInt(quantity, 10), expiry_date || null, description || null]
    );

    res.status(201).json({
      id: result.insertId,
      name,
      quantity: parseInt(quantity, 10),
      expiry_date: expiry_date || null,
      description: description || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error creating medical item:', error);
    res.status(500).json({ error: 'Failed to create medical item' });
  }
});

// PUT update medical item
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, quantity, expiry_date, description } = req.body;

    // Fetch existing item
    const [existing] = await pool.query(
      'SELECT * FROM medical_items WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Medical item not found' });
    }

    const updates = {
      name: name !== undefined ? name : existing[0].name,
      quantity: quantity !== undefined ? parseInt(quantity, 10) : existing[0].quantity,
      expiry_date: expiry_date !== undefined ? expiry_date : existing[0].expiry_date,
      description: description !== undefined ? description : existing[0].description,
    };

    await pool.query(
      `UPDATE medical_items 
       SET name = ?, quantity = ?, expiry_date = ?, description = ?
       WHERE id = ?`,
      [updates.name, updates.quantity, updates.expiry_date, updates.description, id]
    );

    res.json({
      id: parseInt(id, 10),
      ...updates,
    });
  } catch (error) {
    console.error('Error updating medical item:', error);
    res.status(500).json({ error: 'Failed to update medical item' });
  }
});

// DELETE medical item
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query(
      'DELETE FROM medical_items WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Medical item not found' });
    }

    res.json({ message: 'Medical item deleted successfully' });
  } catch (error) {
    console.error('Error deleting medical item:', error);
    res.status(500).json({ error: 'Failed to delete medical item' });
  }
});

module.exports = router;
