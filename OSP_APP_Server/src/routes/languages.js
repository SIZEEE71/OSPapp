// routes/languages.js
const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET all languages
router.get('/', async (req, res) => {
  try {
    const [languages] = await pool.query('SELECT * FROM languages ORDER BY name ASC');
    res.json(languages);
  } catch (error) {
    console.error('Error fetching languages:', error);
    res.status(500).json({ error: 'Failed to fetch languages' });
  }
});

// GET language by ID
router.get('/:id', async (req, res) => {
  try {
    const [language] = await pool.query('SELECT * FROM languages WHERE id = ?', [req.params.id]);
    if (language.length === 0) {
      return res.status(404).json({ error: 'Language not found' });
    }
    res.json(language[0]);
  } catch (error) {
    console.error('Error fetching language:', error);
    res.status(500).json({ error: 'Failed to fetch language' });
  }
});

// POST create language
router.post('/', async (req, res) => {
  try {
    const { name, code } = req.body;
    
    if (!name || !code) {
      return res.status(400).json({ error: 'Name and code are required' });
    }
    
    const [result] = await pool.query(
      'INSERT INTO languages (name, code) VALUES (?, ?)',
      [name, code]
    );
    
    res.status(201).json({ id: result.insertId, name, code });
  } catch (error) {
    console.error('Error creating language:', error);
    res.status(500).json({ error: 'Failed to create language' });
  }
});

// PUT update language
router.put('/:id', async (req, res) => {
  try {
    const { name, code } = req.body;
    
    await pool.query(
      'UPDATE languages SET name = ?, code = ? WHERE id = ?',
      [name, code, req.params.id]
    );
    
    res.json({ id: req.params.id, name, code });
  } catch (error) {
    console.error('Error updating language:', error);
    res.status(500).json({ error: 'Failed to update language' });
  }
});

// DELETE language
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM languages WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting language:', error);
    res.status(500).json({ error: 'Failed to delete language' });
  }
});

// GET firefighter languages
router.get('/firefighter/:firefighterId', async (req, res) => {
  try {
    const [languages] = await pool.query(`
      SELECT l.*, fl.proficiency_level
      FROM languages l
      LEFT JOIN firefighter_languages fl ON l.id = fl.language_id
      WHERE fl.firefighter_id = ?
      ORDER BY l.name ASC
    `, [req.params.firefighterId]);
    res.json(languages);
  } catch (error) {
    console.error('Error fetching firefighter languages:', error);
    res.status(500).json({ error: 'Failed to fetch firefighter languages' });
  }
});

// POST assign language to firefighter
router.post('/assign', async (req, res) => {
  try {
    const { firefighter_id, language_id, proficiency_level } = req.body;
    
    if (!firefighter_id || !language_id) {
      return res.status(400).json({ error: 'Firefighter ID and Language ID are required' });
    }
    
    const validProficiencies = ['podstawowy', 'œredniozaawansowany', 'Zaawansowany', 'P³ynny'];
    const level = proficiency_level || 'basic';
    
    if (!validProficiencies.includes(level)) {
      return res.status(400).json({ error: 'Invalid proficiency level' });
    }
    
    const [result] = await pool.query(
      'INSERT INTO firefighter_languages (firefighter_id, language_id, proficiency_level) VALUES (?, ?, ?)',
      [firefighter_id, language_id, level]
    );
    
    res.status(201).json({ id: result.insertId, firefighter_id, language_id, proficiency_level: level });
  } catch (error) {
    console.error('Error assigning language:', error);
    res.status(500).json({ error: 'Failed to assign language' });
  }
});

// DELETE firefighter language
router.delete('/assign/:firefighterId/:languageId', async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM firefighter_languages WHERE firefighter_id = ? AND language_id = ?',
      [req.params.firefighterId, req.params.languageId]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error removing language:', error);
    res.status(500).json({ error: 'Failed to remove language' });
  }
});

module.exports = router;
