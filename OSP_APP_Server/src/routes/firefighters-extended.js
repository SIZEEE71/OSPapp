// routes/firefighters-extended.js
const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET all firefighters with extended data
router.get('/', async (req, res) => {
  try {
    const { group_id, rank_id } = req.query;
    let query = `
      SELECT 
        f.id, f.name, f.surname, f.rank_id, f.group_id, f.blood_type,
        f.date_of_birth, f.birth_place, f.father_name, f.pesel, f.member_since,
        f.description, f.receives_equivalent, f.email, f.locality, f.street,
        f.house_number, f.phone, f.periodic_exam_until, f.data_processing_consent,
        f.station_name, f.contributions_paid, f.contributions_paid_date, f.created_at, f.updated_at,
        r.name AS rank_name,
        g.name AS group_name,
        GROUP_CONCAT(DISTINCT CONCAT(l.name, ':', fl.proficiency_level) SEPARATOR ';') AS languages,
        GROUP_CONCAT(DISTINCT t.name SEPARATOR ';') AS trainings
      FROM firefighters f
      LEFT JOIN ranks r ON f.rank_id = r.id
      LEFT JOIN firefighter_groups g ON f.group_id = g.id
      LEFT JOIN firefighter_languages fl ON f.id = fl.firefighter_id
      LEFT JOIN languages l ON fl.language_id = l.id
      LEFT JOIN firefighter_trainings ft ON f.id = ft.firefighter_id
      LEFT JOIN trainings t ON ft.training_id = t.id
      WHERE 1=1
    `;
    const params = [];
    
    if (group_id) {
      query += ' AND f.group_id = ?';
      params.push(group_id);
    }
    
    if (rank_id) {
      query += ' AND f.rank_id = ?';
      params.push(rank_id);
    }
    
    query += ' GROUP BY f.id ORDER BY f.surname ASC, f.name ASC';
    
    const [firefighters] = await pool.query(query, params);
    res.json(firefighters);
  } catch (error) {
    console.error('Error fetching firefighters:', error);
    res.status(500).json({ error: 'Failed to fetch firefighters' });
  }
});

// GET firefighters by group (MUST be before /:id)
router.get('/group/:groupId', async (req, res) => {
  try {
    const [firefighters] = await pool.query(`
      SELECT 
        f.*,
        r.name AS rank_name,
        g.name AS group_name
      FROM firefighters f
      LEFT JOIN ranks r ON f.rank_id = r.id
      LEFT JOIN firefighter_groups g ON f.group_id = g.id
      WHERE f.group_id = ?
      ORDER BY f.surname ASC, f.name ASC
    `, [req.params.groupId]);
    
    res.json(firefighters);
  } catch (error) {
    console.error('Error fetching firefighters by group:', error);
    res.status(500).json({ error: 'Failed to fetch firefighters' });
  }
});

// GET firefighters by rank (MUST be before /:id)
router.get('/rank/:rankId', async (req, res) => {
  try {
    const [firefighters] = await pool.query(`
      SELECT 
        f.*,
        r.name AS rank_name,
        g.name AS group_name
      FROM firefighters f
      LEFT JOIN ranks r ON f.rank_id = r.id
      LEFT JOIN firefighter_groups g ON f.group_id = g.id
      WHERE f.rank_id = ?
      ORDER BY f.surname ASC, f.name ASC
    `, [req.params.rankId]);
    
    res.json(firefighters);
  } catch (error) {
    console.error('Error fetching firefighters by rank:', error);
    res.status(500).json({ error: 'Failed to fetch firefighters' });
  }
});

// GET firefighter by ID with all details
router.get('/:id', async (req, res) => {
  try {
    const [firefighters] = await pool.query(`
      SELECT 
        f.*,
        r.name AS rank_name,
        g.name AS group_name
      FROM firefighters f
      LEFT JOIN ranks r ON f.rank_id = r.id
      LEFT JOIN firefighter_groups g ON f.group_id = g.id
      WHERE f.id = ?
    `, [req.params.id]);
    
    if (firefighters.length === 0) {
      return res.status(404).json({ error: 'Firefighter not found' });
    }
    
    const firefighter = firefighters[0];
    
    // Get languages
    const [languages] = await pool.query(`
      SELECT l.id, l.name, fl.proficiency_level
      FROM firefighter_languages fl
      JOIN languages l ON fl.language_id = l.id
      WHERE fl.firefighter_id = ?
    `, [req.params.id]);
    
    // Get trainings
    const [trainings] = await pool.query(`
      SELECT t.id, t.name, ft.completion_date, ft.validity_until
      FROM firefighter_trainings ft
      JOIN trainings t ON ft.training_id = t.id
      WHERE ft.firefighter_id = ?
    `, [req.params.id]);
    
    res.json({ ...firefighter, languages, trainings });
  } catch (error) {
    console.error('Error fetching firefighter:', error);
    res.status(500).json({ error: 'Failed to fetch firefighter' });
  }
});

// POST create firefighter
router.post('/', async (req, res) => {
  try {
    const {
      name, surname, rank_id, group_id, blood_type, date_of_birth, birth_place,
      father_name, pesel, member_since, description, receives_equivalent,
      email, locality, street, house_number, phone, periodic_exam_until,
      data_processing_consent, station_name
    } = req.body;
    
    if (!name || !surname) {
      return res.status(400).json({ error: 'Name and surname are required' });
    }
    
    const [result] = await pool.query(
      `INSERT INTO firefighters (
        name, surname, rank_id, group_id, blood_type, date_of_birth, birth_place,
        father_name, pesel, member_since, description, receives_equivalent,
        email, locality, street, house_number, phone, periodic_exam_until,
        data_processing_consent, station_name
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name, surname, rank_id || null, group_id || null, blood_type || null,
        date_of_birth || null, birth_place || null, father_name || null,
        pesel || null, member_since || null, description || null,
        receives_equivalent ? 1 : 0, email || null, locality || null,
        street || null, house_number || null, phone || null,
        periodic_exam_until || null, data_processing_consent ? 1 : 0,
        station_name || null
      ]
    );
    
    res.status(201).json({ id: result.insertId, ...req.body });
  } catch (error) {
    console.error('Error creating firefighter:', error);
    res.status(500).json({ error: 'Failed to create firefighter' });
  }
});

// PUT update firefighter
router.put('/:id', async (req, res) => {
  try {
    const [existingRows] = await pool.query('SELECT * FROM firefighters WHERE id = ?', [req.params.id]);
    if (existingRows.length === 0) {
      return res.status(404).json({ error: 'Firefighter not found' });
    }

    const existing = existingRows[0];
    const toNullable = (value) => (value === '' ? null : value);

    const {
      name, surname, rank_id, group_id, blood_type, date_of_birth, birth_place,
      father_name, pesel, member_since, description, receives_equivalent,
      email, locality, street, house_number, phone, periodic_exam_until,
      data_processing_consent, station_name, contributions_paid, contributions_paid_date
    } = req.body;
    
    const updatedData = {
      name: name !== undefined ? name : existing.name,
      surname: surname !== undefined ? surname : existing.surname,
      rank_id: rank_id !== undefined ? toNullable(rank_id) : existing.rank_id,
      group_id: group_id !== undefined ? toNullable(group_id) : existing.group_id,
      blood_type: blood_type !== undefined ? toNullable(blood_type) : existing.blood_type,
      date_of_birth: date_of_birth !== undefined ? toNullable(date_of_birth) : existing.date_of_birth,
      birth_place: birth_place !== undefined ? toNullable(birth_place) : existing.birth_place,
      father_name: father_name !== undefined ? toNullable(father_name) : existing.father_name,
      pesel: pesel !== undefined ? toNullable(pesel) : existing.pesel,
      member_since: member_since !== undefined ? toNullable(member_since) : existing.member_since,
      description: description !== undefined ? toNullable(description) : existing.description,
      receives_equivalent: receives_equivalent !== undefined ? (receives_equivalent ? 1 : 0) : existing.receives_equivalent,
      email: email !== undefined ? toNullable(email) : existing.email,
      locality: locality !== undefined ? toNullable(locality) : existing.locality,
      street: street !== undefined ? toNullable(street) : existing.street,
      house_number: house_number !== undefined ? toNullable(house_number) : existing.house_number,
      phone: phone !== undefined ? toNullable(phone) : existing.phone,
      periodic_exam_until: periodic_exam_until !== undefined ? toNullable(periodic_exam_until) : existing.periodic_exam_until,
      data_processing_consent: data_processing_consent !== undefined ? (data_processing_consent ? 1 : 0) : existing.data_processing_consent,
      station_name: station_name !== undefined ? toNullable(station_name) : existing.station_name,
      contributions_paid: contributions_paid !== undefined ? (contributions_paid ? 1 : 0) : existing.contributions_paid,
      contributions_paid_date:
        contributions_paid !== undefined
          ? (contributions_paid ? (contributions_paid_date || new Date().toISOString().split('T')[0]) : null)
          : toNullable(contributions_paid_date) ?? existing.contributions_paid_date
    };

    if (!updatedData.name || !updatedData.surname) {
      return res.status(400).json({ error: 'Name and surname are required' });
    }

    await pool.query(
      `UPDATE firefighters SET
        name = ?, surname = ?, rank_id = ?, group_id = ?, blood_type = ?,
        date_of_birth = ?, birth_place = ?, father_name = ?, pesel = ?,
        member_since = ?, description = ?, receives_equivalent = ?,
        email = ?, locality = ?, street = ?, house_number = ?, phone = ?,
        periodic_exam_until = ?, data_processing_consent = ?, station_name = ?,
        contributions_paid = ?, contributions_paid_date = ?
      WHERE id = ?`,
      [
        updatedData.name,
        updatedData.surname,
        updatedData.rank_id,
        updatedData.group_id,
        updatedData.blood_type,
        updatedData.date_of_birth,
        updatedData.birth_place,
        updatedData.father_name,
        updatedData.pesel,
        updatedData.member_since,
        updatedData.description,
        updatedData.receives_equivalent,
        updatedData.email,
        updatedData.locality,
        updatedData.street,
        updatedData.house_number,
        updatedData.phone,
        updatedData.periodic_exam_until,
        updatedData.data_processing_consent,
        updatedData.station_name,
        updatedData.contributions_paid,
        updatedData.contributions_paid_date,
        req.params.id
      ]
    );

    res.json({ id: req.params.id, ...existing, ...updatedData });
  } catch (error) {
    console.error('Error updating firefighter:', error);
    res.status(500).json({ error: 'Failed to update firefighter' });
  }
});

// DELETE firefighter
router.delete('/:id', async (req, res) => {
  try {
    // Delete related records first
    await pool.query('DELETE FROM firefighter_trainings WHERE firefighter_id = ?', [req.params.id]);
    await pool.query('DELETE FROM firefighter_languages WHERE firefighter_id = ?', [req.params.id]);
    
    // Delete firefighter
    await pool.query('DELETE FROM firefighters WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting firefighter:', error);
    res.status(500).json({ error: 'Failed to delete firefighter' });
  }
});


module.exports = router;
