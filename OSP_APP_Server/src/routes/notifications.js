// server/routes/notifications.js
const express = require('express');
const router = express.Router();
const pool = require('../db');

/**
 * GET /api/notifications/:firefighterId
 * Returns notifications based on firefighter's role:
 * - Everyone: Past alarms + own periodic exam (badania okresowe)
 * - Naczelnik (11): All firefighters' periodic exams
 * - Prezes (12): All firefighters' periodic exams + equipment/vehicle inspections
 */
router.get('/:firefighterId', async (req, res) => {
  const firefighterId = parseInt(req.params.firefighterId, 10);
  if (Number.isNaN(firefighterId)) {
    return res.status(400).json({ error: 'Invalid firefighter ID' });
  }

  try {
    // Get firefighter's rank to determine permissions
    const [firefighterRows] = await pool.query(
      'SELECT f.id, f.name, f.surname, r.id as rank_id, r.name as rank_name FROM firefighters f LEFT JOIN ranks r ON f.rank_id = r.id WHERE f.id = ?',
      [firefighterId]
    );

    if (firefighterRows.length === 0) {
      return res.status(404).json({ error: 'Firefighter not found' });
    }

    const firefighter = firefighterRows[0];
    const rankId = firefighter.rank_id;
    const notifications = {
      past_alarms: [],
      periodic_exams: [],
      all_firefighters_exams: [],
      unpaid_contributions: [],
      vehicle_inspections: [],
    };

    // PART 1: Past alarms - for everyone
    const [pastAlarms] = await pool.query(
      `SELECT 
        a.id, a.alarm_time, a.alarm_type, a.location, a.description, a.end_time,
        COUNT(DISTINCT ar.firefighter_id) as crew_count
      FROM alarms a
      LEFT JOIN alarm_responses ar ON a.id = ar.alarm_id
      WHERE a.alarm_time < NOW()
      GROUP BY a.id
      ORDER BY a.alarm_time DESC
      LIMIT 20`
    );
    notifications.past_alarms = pastAlarms;

    // PART 2: Own periodic exam - for everyone
    const [ownPeriodicExam] = await pool.query(
      `SELECT 
        id, name, surname, periodic_exam_until as validity_until,
        "Badanie okresowe" as training_name,
        DATEDIFF(periodic_exam_until, NOW()) as days_until_expiry
      FROM firefighters
      WHERE id = ? 
        AND periodic_exam_until IS NOT NULL
        AND periodic_exam_until > NOW()
        AND DATEDIFF(periodic_exam_until, NOW()) <= 90`,
      [firefighterId]
    );
    notifications.periodic_exams = ownPeriodicExam;

    // PART 2.5: Own unpaid contributions - for everyone
    const [ownUnpaidContributions] = await pool.query(
      `SELECT id, name, surname
      FROM firefighters
      WHERE id = ? AND contributions_paid = 0`,
      [firefighterId]
    );
    notifications.unpaid_contributions = ownUnpaidContributions;

    // PART 3: If Naczelnik or above - show all firefighters' periodic exams
    if (rankId === 11 || rankId === 12) {
      const [allPeriodicExams] = await pool.query(
        `SELECT 
          id, name, surname, periodic_exam_until as validity_until,
          "Badanie okresowe" as training_name,
          DATEDIFF(periodic_exam_until, NOW()) as days_until_expiry
        FROM firefighters
        WHERE periodic_exam_until IS NOT NULL
          AND periodic_exam_until > NOW()
          AND DATEDIFF(periodic_exam_until, NOW()) <= 90
        ORDER BY periodic_exam_until ASC`
      );
      notifications.all_firefighters_exams = allPeriodicExams;
    }

    // PART 4: If Prezes - show vehicle inspections
    if (rankId === 12) {
      // Vehicle inspections (only inspection_until, not insurance_until)
      const [vehicleInspections] = await pool.query(
        `SELECT 
          id, name, operational_number,
          inspection_until, insurance_until,
          DATEDIFF(inspection_until, NOW()) as days_until_inspection,
          DATEDIFF(insurance_until, NOW()) as days_until_insurance
        FROM vehicles
        WHERE (inspection_until IS NOT NULL OR insurance_until IS NOT NULL)
          AND (inspection_until > NOW() OR insurance_until > NOW())
          AND (DATEDIFF(inspection_until, NOW()) <= 90 OR DATEDIFF(insurance_until, NOW()) <= 90)
        ORDER BY LEAST(inspection_until, insurance_until) ASC`
      );
      notifications.vehicle_inspections = vehicleInspections;
    }

    res.json(notifications);
  } catch (err) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;
