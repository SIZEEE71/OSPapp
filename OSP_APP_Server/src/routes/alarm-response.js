// src/routes/alarm-response.js
// Endpoints dla systemu alarmu z nasłuchiwaniem połączeń

const express = require('express');
const router = express.Router();
const pool = require('../db');

const TRAINING_FILTERS = [
  { key: 'driver_c', label: 'Kurs Kierowcy C' },
  { key: 'first_aid', label: 'Pierwsza Pomoc' },
];

// Helper to fetch detailed stats for an alarm
async function getAlarmResponseStats(alarmId) {
  const [responses] = await pool.query(
    `SELECT 
        ar.firefighter_id,
        f.name,
        f.surname,
        ar.response_type,
        ar.responded_at,
        ar.arrival_time,
        EXISTS(
          SELECT 1 FROM firefighter_trainings ft
          JOIN trainings t ON t.id = ft.training_id
          WHERE ft.firefighter_id = ar.firefighter_id
            AND t.name = 'Kurs Kierowcy C'
            AND (ft.validity_until IS NULL OR ft.validity_until >= CURDATE())
        ) AS has_driver_c,
        EXISTS(
          SELECT 1 FROM firefighter_trainings ft
          JOIN trainings t ON t.id = ft.training_id
          WHERE ft.firefighter_id = ar.firefighter_id
            AND t.name = 'Pierwsza Pomoc'
            AND (ft.validity_until IS NULL OR ft.validity_until >= CURDATE())
        ) AS has_first_aid
       FROM alarm_responses ar
       LEFT JOIN firefighters f ON ar.firefighter_id = f.id
       WHERE ar.alarm_id = ?
       ORDER BY ar.response_type DESC, ar.responded_at ASC`,
    [alarmId]
  );

  const summary = {
    total: responses.length,
    confirmed: responses.filter(r => r.response_type === 'TAK').length,
    not_confirmed: responses.filter(r => r.response_type === 'NIE').length,
  };

  const trainingSummary = {};
  TRAINING_FILTERS.forEach((filter) => {
    const column = `has_${filter.key}`;
    trainingSummary[filter.key] = responses.filter(
      (r) => r.response_type === 'TAK' && Boolean(r[column])
    ).length;
  });

  const normalizedResponses = responses.map((response) => {
    const normalized = { ...response };
    TRAINING_FILTERS.forEach((filter) => {
      const column = `has_${filter.key}`;
      normalized[column] = Boolean(response[column]);
    });
    return normalized;
  });

  return { summary, trainingSummary, responses: normalizedResponses };
}

/**
 * POST /api/alarm-response/trigger
 * Tworzy nowy alarm na podstawie przychodzącego połączenia
 * 
 * Body:
 * {
 *   "call_phone_number": "608101402",
 *   "alarm_time": "2025-12-14 15:30:45"  // opcjonalne, jeśli nie podane = NOW()
 * }
 */
router.post('/trigger', async (req, res) => {
  const { call_phone_number, alarm_time } = req.body;

  if (!call_phone_number) {
    return res.status(400).json({ error: 'call_phone_number is required' });
  }

  try {
    // Użyj podanego czasu lub bieżący czas
    const finalAlarmTime = alarm_time ? new Date(alarm_time) : new Date();
    
    // Wstaw nowy alarm
    const [result] = await pool.query(
      `INSERT INTO alarms (alarm_time, call_phone_number, created_at, updated_at) 
       VALUES (?, ?, NOW(), NOW())`,
      [finalAlarmTime, call_phone_number]
    );

    const alarmId = result.insertId;

    // Pobierz wszystkich strażaków (aby dodać do alarm_responses)
    const [firefighters] = await pool.query(
      'SELECT id FROM firefighters WHERE phone_number IS NOT NULL'
    );

    // Dodaj wpis dla każdego strażaka w alarm_responses (domyślnie NIE)
    if (firefighters.length > 0) {
      const values = firefighters.map(ff => [alarmId, ff.id, 'NIE']);
      
      await pool.query(
        'INSERT INTO alarm_responses (alarm_id, firefighter_id, response_type) VALUES ?',
        [values]
      );
    }

    // Zwróć informacje o nowo utworzonym alarmie
    res.status(201).json({
      alarmId: alarmId,
      alarm_time: finalAlarmTime,
      call_phone_number: call_phone_number,
      firefighters_count: firefighters.length,
      message: 'Alarm created successfully'
    });

  } catch (err) {
    console.error('Error creating alarm:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

/**
 * POST /api/alarm-response/:alarmId/respond
 * Zapisuje odpowiedź strażaka na alarm
 * 
 * Body:
 * {
 *   "firefighter_id": 4,
 *   "response_type": "TAK" // lub "NIE"
 * }
 */
router.post('/:alarmId/respond', async (req, res) => {
  const alarmId = parseInt(req.params.alarmId, 10);
  const { firefighter_id, response_type } = req.body;

  if (!firefighter_id || !response_type) {
    return res.status(400).json({ error: 'firefighter_id and response_type are required' });
  }

  if (!['TAK', 'NIE'].includes(response_type)) {
    return res.status(400).json({ error: 'response_type must be TAK or NIE' });
  }

  try {
    // Sprawdź czy alarm istnieje
    const [alarmRows] = await pool.query(
      'SELECT id FROM alarms WHERE id = ?',
      [alarmId]
    );

    if (alarmRows.length === 0) {
      return res.status(404).json({ error: 'Alarm not found' });
    }

    // Aktualizuj response_type w alarm_responses
    const [result] = await pool.query(
      `UPDATE alarm_responses 
       SET response_type = ?, responded_at = NOW()
       WHERE alarm_id = ? AND firefighter_id = ?`,
      [response_type, alarmId, firefighter_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Response record not found' });
    }

    const stats = await getAlarmResponseStats(alarmId);

    res.json({
      success: true,
      firefighter_id: firefighter_id,
      response_type: response_type,
      summary: stats.summary,
      trainingSummary: stats.trainingSummary,
      responses: stats.responses,
      message: 'Response recorded successfully'
    });

  } catch (err) {
    console.error('Error recording response:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

/**
 * GET /api/alarm-response/:alarmId/stats
 * Pobierz statystykę odpowiedzi na alarm
 */
router.get('/:alarmId/stats', async (req, res) => {
  const alarmId = parseInt(req.params.alarmId, 10);

  try {
    const stats = await getAlarmResponseStats(alarmId);

    res.json({
      alarmId: alarmId,
      summary: stats.summary,
      trainingSummary: stats.trainingSummary,
      responses: stats.responses
    });

  } catch (err) {
    console.error('Error fetching stats:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;
