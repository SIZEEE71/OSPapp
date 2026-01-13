// routes/trainings.js
const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET all trainings
router.get('/', async (req, res) => {
  try {
    const [trainings] = await pool.query('SELECT * FROM trainings ORDER BY name ASC');
    res.json(trainings);
  } catch (error) {
    console.error('Error fetching trainings:', error);
    res.status(500).json({ error: 'Failed to fetch trainings' });
  }
});

// GET training by ID
router.get('/:id', async (req, res) => {
  try {
    const [training] = await pool.query('SELECT * FROM trainings WHERE id = ?', [req.params.id]);
    if (training.length === 0) {
      return res.status(404).json({ error: 'Training not found' });
    }
    res.json(training[0]);
  } catch (error) {
    console.error('Error fetching training:', error);
    res.status(500).json({ error: 'Failed to fetch training' });
  }
});

// POST create training
router.post('/', async (req, res) => {
  try {
    const { name, description, validity_months } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    
    const [result] = await pool.query(
      'INSERT INTO trainings (name, description, validity_months) VALUES (?, ?, ?)',
      [name, description || null, validity_months || null]
    );
    
    res.status(201).json({ id: result.insertId, name, description, validity_months });
  } catch (error) {
    console.error('Error creating training:', error);
    res.status(500).json({ error: 'Failed to create training' });
  }
});

// PUT update training
router.put('/:id', async (req, res) => {
  try {
    const { name, description, validity_months } = req.body;
    
    await pool.query(
      'UPDATE trainings SET name = ?, description = ?, validity_months = ? WHERE id = ?',
      [name, description, validity_months, req.params.id]
    );
    
    res.json({ id: req.params.id, name, description, validity_months });
  } catch (error) {
    console.error('Error updating training:', error);
    res.status(500).json({ error: 'Failed to update training' });
  }
});

// DELETE training
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM trainings WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting training:', error);
    res.status(500).json({ error: 'Failed to delete training' });
  }
});

// GET firefighter trainings
router.get('/firefighter/:firefighterId', async (req, res) => {
  try {
    const [trainings] = await pool.query(`
      SELECT t.*, ft.completion_date, ft.validity_until 
      FROM trainings t
      LEFT JOIN firefighter_trainings ft ON t.id = ft.training_id 
      WHERE ft.firefighter_id = ?
      ORDER BY t.name ASC
    `, [req.params.firefighterId]);
    res.json(trainings);
  } catch (error) {
    console.error('Error fetching firefighter trainings:', error);
    res.status(500).json({ error: 'Failed to fetch firefighter trainings' });
  }
});

// POST assign training to firefighter
router.post('/assign', async (req, res) => {
  try {
    const { firefighter_id, training_id, completion_date } = req.body;
    
    if (!firefighter_id || !training_id) {
      return res.status(400).json({ error: 'Firefighter ID and Training ID are required' });
    }
    
    // Calculate validity_until based on training's validity_months
    const [training] = await pool.query('SELECT validity_months FROM trainings WHERE id = ?', [training_id]);
    let validity_until = null;
    
    if (training.length > 0 && training[0].validity_months && completion_date) {
      const date = new Date(completion_date);
      date.setMonth(date.getMonth() + training[0].validity_months);
      validity_until = date.toISOString().split('T')[0];
    }
    
    const [result] = await pool.query(
      'INSERT INTO firefighter_trainings (firefighter_id, training_id, completion_date, validity_until) VALUES (?, ?, ?, ?)',
      [firefighter_id, training_id, completion_date || null, validity_until]
    );
    
    res.status(201).json({ id: result.insertId, firefighter_id, training_id, completion_date, validity_until });
  } catch (error) {
    console.error('Error assigning training:', error);
    res.status(500).json({ error: 'Failed to assign training' });
  }
});

// DELETE firefighter training
router.delete('/assign/:firefighterId/:trainingId', async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM firefighter_trainings WHERE firefighter_id = ? AND training_id = ?',
      [req.params.firefighterId, req.params.trainingId]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error removing training:', error);
    res.status(500).json({ error: 'Failed to remove training' });
  }
});

module.exports = router;
