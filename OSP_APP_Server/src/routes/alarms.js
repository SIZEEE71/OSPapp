const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET all alarms
router.get('/', async (req, res) => {
  try {
    const [alarms] = await pool.query(
      `SELECT a.id, a.alarm_time, a.end_time, a.alarm_type, a.location, a.description, a.vehicle_id, a.created_at, a.updated_at,
              GROUP_CONCAT(ar.firefighter_id) as firefighter_ids
       FROM alarms a
       LEFT JOIN alarm_responses ar ON a.id = ar.alarm_id
       GROUP BY a.id, a.alarm_time, a.end_time, a.alarm_type, a.location, a.description, a.vehicle_id, a.created_at, a.updated_at
       ORDER BY a.alarm_time DESC`
    );
    res.json(alarms);
  } catch (error) {
    console.error('Error fetching alarms:', error);
    res.status(500).json({ error: 'Failed to fetch alarms' });
  }
});

// GET single alarm
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [alarms] = await pool.query(
      `SELECT a.id, a.alarm_time, a.end_time, a.alarm_type, a.location, a.description, a.vehicle_id, a.created_at, a.updated_at,
              GROUP_CONCAT(ar.firefighter_id) as firefighter_ids
       FROM alarms a
       LEFT JOIN alarm_responses ar ON a.id = ar.alarm_id
       WHERE a.id = ?
       GROUP BY a.id, a.alarm_time, a.end_time, a.alarm_type, a.location, a.description, a.vehicle_id, a.created_at, a.updated_at`,
      [id]
    );
    
    if (alarms.length === 0) {
      return res.status(404).json({ error: 'Alarm not found' });
    }
    
    res.json(alarms[0]);
  } catch (error) {
    console.error('Error fetching alarm:', error);
    res.status(500).json({ error: 'Failed to fetch alarm' });
  }
});

// POST create alarm
router.post('/', async (req, res) => {
  try {
    const { alarm_time, end_time, alarm_type, location, description, vehicle_id } = req.body;
    
    if (!alarm_time) {
      return res.status(400).json({ error: 'Alarm time is required' });
    }
    
    const [result] = await pool.query(
      `INSERT INTO alarms (alarm_time, end_time, alarm_type, location, description, vehicle_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [alarm_time, end_time || null, alarm_type || null, location || null, description || null, vehicle_id || null]
    );
    
    res.status(201).json({ 
      id: result.insertId, 
      alarm_time,
      end_time,
      alarm_type,
      location,
      description,
      vehicle_id 
    });
  } catch (error) {
    console.error('Error creating alarm:', error);
    res.status(500).json({ error: 'Failed to create alarm' });
  }
});

// PUT update alarm
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { alarm_type, location, description, vehicle_id, end_time } = req.body;
    
    const [result] = await pool.query(
      `UPDATE alarms 
       SET alarm_type = ?, location = ?, description = ?, vehicle_id = ?, end_time = ?
       WHERE id = ?`,
      [alarm_type || null, location || null, description || null, vehicle_id || null, end_time || null, id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Alarm not found' });
    }
    
    res.json({ message: 'Alarm updated successfully' });
  } catch (error) {
    console.error('Error updating alarm:', error);
    res.status(500).json({ error: 'Failed to update alarm' });
  }
});

// DELETE alarm
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Delete related records first
    await pool.query('DELETE FROM alarm_responses WHERE alarm_id = ?', [id]);
    
    const [result] = await pool.query(
      'DELETE FROM alarms WHERE id = ?',
      [id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Alarm not found' });
    }
    
    res.json({ message: 'Alarm deleted successfully' });
  } catch (error) {
    console.error('Error deleting alarm:', error);
    res.status(500).json({ error: 'Failed to delete alarm' });
  }
});

// POST record firefighter response to alarm
router.post('/:id/respond', async (req, res) => {
  try {
    const { id } = req.params;
    const { firefighter_id } = req.body;
    
    if (!firefighter_id) {
      return res.status(400).json({ error: 'Firefighter ID is required' });
    }
    
    const [result] = await pool.query(
      `INSERT INTO alarm_responses (alarm_id, firefighter_id, responded_at)
       VALUES (?, ?, NOW())`,
      [id, firefighter_id]
    );
    
    res.status(201).json({ 
      id: result.insertId,
      alarm_id: id,
      firefighter_id
    });
  } catch (error) {
    console.error('Error recording response:', error);
    res.status(500).json({ error: 'Failed to record response' });
  }
});

// GET statistics - alarms by type
router.get('/stats/by-type', async (req, res) => {
  try {
    const [[{ total_alarms }]] = await pool.query(
      `SELECT COUNT(*) as total_alarms FROM alarms`
    );
    
    const [stats] = await pool.query(
      `SELECT 
         COALESCE(alarm_type, 'Brak typu') as type,
         COUNT(*) as count
       FROM alarms
       GROUP BY COALESCE(alarm_type, 'Brak typu')
       ORDER BY count DESC`
    );
    
    res.json({
      total: total_alarms,
      byType: stats
    });
  } catch (error) {
    console.error('Error fetching alarm type stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// GET statistics - firefighters in crew
router.get('/stats/firefighters', async (req, res) => {
  try {
    const [stats] = await pool.query(
      `SELECT 
         f.id,
         f.name,
         f.surname,
         COUNT(ac.alarm_id) as crew_count
       FROM firefighters f
       LEFT JOIN alarm_crew ac ON f.id = ac.firefighter_id
       GROUP BY f.id, f.name, f.surname
       HAVING crew_count > 0
       ORDER BY crew_count DESC`
    );
    res.json(stats);
  } catch (error) {
    console.error('Error fetching firefighter stats:', error);
    res.status(500).json({ error: 'Failed to fetch firefighter statistics' });
  }
});

// GET alarm crew
router.get('/:id/crew', async (req, res) => {
  try {
    const [crew] = await pool.query(
      `SELECT 
         ac.id,
         ac.position,
         f.id as firefighter_id,
         f.name,
         f.surname
       FROM alarm_crew ac
       JOIN firefighters f ON ac.firefighter_id = f.id
       WHERE ac.alarm_id = ?
       ORDER BY CASE 
         WHEN ac.position = 'Kierowca' THEN 1
         WHEN ac.position = 'Dowódca' THEN 2
         ELSE 3
       END`,
      [req.params.id]
    );
    res.json(crew);
  } catch (error) {
    console.error('Error fetching alarm crew:', error);
    res.status(500).json({ error: 'Failed to fetch crew' });
  }
});

// POST assign crew to alarm
router.post('/:id/crew', async (req, res) => {
  const { firefighter_id, position } = req.body;
  try {
    await pool.query(
      `INSERT INTO alarm_crew (alarm_id, firefighter_id, position)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE firefighter_id = ?, updated_at = CURRENT_TIMESTAMP`,
      [req.params.id, firefighter_id, position, firefighter_id]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error assigning crew:', error);
    res.status(500).json({ error: 'Failed to assign crew' });
  }
});

// DELETE crew from alarm
router.delete('/:id/crew/:position', async (req, res) => {
  try {
    await pool.query(
      `DELETE FROM alarm_crew WHERE alarm_id = ? AND position = ?`,
      [req.params.id, req.params.position]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error removing crew:', error);
    res.status(500).json({ error: 'Failed to remove crew' });
  }
});

module.exports = router;

