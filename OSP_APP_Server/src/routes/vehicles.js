const express = require('express');
const pool = require('../db');

const router = express.Router();

// GET all vehicles
router.get('/', async (req, res) => {
  try {
    const { station_name } = req.query;
    
    let query = 'SELECT * FROM vehicles';
    let params = [];
    
    if (station_name) {
      query += ' WHERE station_name = ?';
      params.push(station_name);
    }
    
    query += ' ORDER BY name ASC';
    
    const [vehicles] = await pool.query(query, params);
    res.json(vehicles);
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    res.status(500).json({ error: 'Failed to fetch vehicles' });
  }
});

// GET vehicle by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [vehicles] = await pool.query(
      'SELECT * FROM vehicles WHERE id = ?',
      [id]
    );

    if (vehicles.length === 0) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    res.json(vehicles[0]);
  } catch (error) {
    console.error('Error fetching vehicle:', error);
    res.status(500).json({ error: 'Failed to fetch vehicle' });
  }
});

// POST new vehicle
router.post('/', async (req, res) => {
  try {
    const {
      station_name,
      name,
      operational_number,
      inspection_until,
      insurance_until,
      max_people,
      fire_extinguishing_agents,
      water_capacity,
      pump_description,
      total_mass,
      engine_power,
      drive_type,
      chassis_producer,
      body_production_year,
      description,
    } = req.body;

    if (!name || !operational_number) {
      return res.status(400).json({ error: 'name and operational_number are required' });
    }

    const [result] = await pool.query(
      `INSERT INTO vehicles (
        station_name, name, operational_number, inspection_until, insurance_until,
        max_people, fire_extinguishing_agents, water_capacity, pump_description,
        total_mass, engine_power, drive_type, chassis_producer, body_production_year, description
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        station_name || null,
        name,
        operational_number,
        inspection_until || null,
        insurance_until || null,
        max_people || null,
        fire_extinguishing_agents || null,
        water_capacity || null,
        pump_description || null,
        total_mass || null,
        engine_power || null,
        drive_type || null,
        chassis_producer || null,
        body_production_year || null,
        description || null,
      ]
    );

    res.status(201).json({ id: result.insertId, ...req.body });
  } catch (error) {
    console.error('Error creating vehicle:', error);
    res.status(500).json({ error: 'Failed to create vehicle' });
  }
});

// PUT update vehicle
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const allowedFields = [
      'station_name', 'name', 'operational_number', 'inspection_until', 'insurance_until',
      'max_people', 'fire_extinguishing_agents', 'water_capacity', 'pump_description',
      'total_mass', 'engine_power', 'drive_type', 'chassis_producer', 'body_production_year', 'description'
    ];

    const fields = Object.keys(updates).filter(key => allowedFields.includes(key));
    
    if (fields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => updates[field]);
    values.push(id);

    await pool.query(
      `UPDATE vehicles SET ${setClause} WHERE id = ?`,
      values
    );

    res.json({ id, ...updates });
  } catch (error) {
    console.error('Error updating vehicle:', error);
    res.status(500).json({ error: 'Failed to update vehicle' });
  }
});

// DELETE vehicle
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query(
      'DELETE FROM vehicles WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    res.json({ message: 'Vehicle deleted successfully' });
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    res.status(500).json({ error: 'Failed to delete vehicle' });
  }
});

module.exports = router;
