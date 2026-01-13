// routes/ranks.js
const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET all ranks
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    let query = 'SELECT * FROM ranks';
    let params = [];
    
    if (category) {
      query += ' WHERE category = ?';
      params.push(category);
    }
    
    query += ' ORDER BY category, sort_order ASC';
    
    const [ranks] = await pool.query(query, params);
    res.json(ranks);
  } catch (error) {
    console.error('Error fetching ranks:', error);
    res.status(500).json({ error: 'Failed to fetch ranks' });
  }
});

// GET rank by ID
router.get('/:id', async (req, res) => {
  try {
    const [rank] = await pool.query('SELECT * FROM ranks WHERE id = ?', [req.params.id]);
    if (rank.length === 0) {
      return res.status(404).json({ error: 'Rank not found' });
    }
    res.json(rank[0]);
  } catch (error) {
    console.error('Error fetching rank:', error);
    res.status(500).json({ error: 'Failed to fetch rank' });
  }
});

// POST create rank
router.post('/', async (req, res) => {
  try {
    const { category, rank_name, distinction, sort_order } = req.body;
    
    if (!category || !rank_name) {
      return res.status(400).json({ error: 'Category and rank_name are required' });
    }
    
    const [result] = await pool.query(
      'INSERT INTO ranks (category, rank_name, distinction, sort_order) VALUES (?, ?, ?, ?)',
      [category, rank_name, distinction, sort_order || 0]
    );
    
    res.status(201).json({ id: result.insertId, category, rank_name, distinction });
  } catch (error) {
    console.error('Error creating rank:', error);
    res.status(500).json({ error: 'Failed to create rank' });
  }
});

// PUT update rank
router.put('/:id', async (req, res) => {
  try {
    const { rank_name, distinction, sort_order } = req.body;
    
    await pool.query(
      'UPDATE ranks SET rank_name = ?, distinction = ?, sort_order = ? WHERE id = ?',
      [rank_name, distinction, sort_order, req.params.id]
    );
    
    res.json({ id: req.params.id, rank_name, distinction, sort_order });
  } catch (error) {
    console.error('Error updating rank:', error);
    res.status(500).json({ error: 'Failed to update rank' });
  }
});

// DELETE rank
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM ranks WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting rank:', error);
    res.status(500).json({ error: 'Failed to delete rank' });
  }
});

module.exports = router;
