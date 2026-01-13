// routes/groups.js
const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET all groups
router.get('/', async (req, res) => {
  try {
    const [groups] = await pool.query('SELECT * FROM firefighter_groups ORDER BY name ASC');
    res.json(groups);
  } catch (error) {
    console.error('Error fetching groups:', error);
    res.status(500).json({ error: 'Failed to fetch groups' });
  }
});

// GET group by ID
router.get('/:id', async (req, res) => {
  try {
    const [group] = await pool.query('SELECT * FROM firefighter_groups WHERE id = ?', [req.params.id]);
    if (group.length === 0) {
      return res.status(404).json({ error: 'Group not found' });
    }
    res.json(group[0]);
  } catch (error) {
    console.error('Error fetching group:', error);
    res.status(500).json({ error: 'Failed to fetch group' });
  }
});

// POST create group
router.post('/', async (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    
    const [result] = await pool.query(
      'INSERT INTO firefighter_groups (name, description) VALUES (?, ?)',
      [name, description || null]
    );
    
    res.status(201).json({ id: result.insertId, name, description });
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({ error: 'Failed to create group' });
  }
});

// PUT update group
router.put('/:id', async (req, res) => {
  try {
    const { name, description } = req.body;
    
    await pool.query(
      'UPDATE firefighter_groups SET name = ?, description = ? WHERE id = ?',
      [name, description, req.params.id]
    );
    
    res.json({ id: req.params.id, name, description });
  } catch (error) {
    console.error('Error updating group:', error);
    res.status(500).json({ error: 'Failed to update group' });
  }
});

// DELETE group
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM firefighter_groups WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting group:', error);
    res.status(500).json({ error: 'Failed to delete group' });
  }
});

module.exports = router;
