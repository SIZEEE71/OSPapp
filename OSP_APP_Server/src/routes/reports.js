const express = require('express');
const router = express.Router();
const pool = require('../db');
const PDFDocument = require('pdfkit');
const path = require('path');

const regularFont = path.join(__dirname, '..', 'fonts', 'Roboto-Regular.ttf');
const boldFont = path.join(__dirname, '..', 'fonts', 'Roboto-Bold.ttf');

// GET all reports
router.get('/', async (req, res) => {
  try {
    const [reports] = await pool.query(
      `SELECT 
        r.id,
        r.alarm_id,
        r.report_date,
        r.report_number,
        r.created_by,
        r.created_at,
        a.alarm_time,
        a.alarm_type,
        a.location,
        f.name as created_by_name,
        f.surname as created_by_surname
        FROM reports r
        LEFT JOIN alarms a ON r.alarm_id = a.id
        LEFT JOIN firefighters f ON r.created_by = f.id
        ORDER BY r.report_date DESC, r.created_at DESC`
    );
    res.json(reports);
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// GET single report
router.get('/:id', async (req, res) => {
  try {
    const [reports] = await pool.query(
      `SELECT 
         r.id,
         r.alarm_id,
         r.report_date,
         r.report_number,
         r.created_by,
         r.created_at,
         a.alarm_time,
         a.alarm_type,
         a.location,
         f.name as created_by_name,
         f.surname as created_by_surname
       FROM reports r
       LEFT JOIN alarms a ON r.alarm_id = a.id
       LEFT JOIN firefighters f ON r.created_by = f.id
       WHERE r.id = ?`,
      [req.params.id]
    );

    if (reports.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.json(reports[0]);
  } catch (error) {
    console.error('Error fetching report:', error);
    res.status(500).json({ error: 'Failed to fetch report' });
  }
});

// POST create report
router.post('/', async (req, res) => {
  try {
    const { alarm_id, report_date, report_number, created_by } = req.body;

    if (!alarm_id || !report_date) {
      return res.status(400).json({ error: 'Alarm ID and report date are required' });
    }

    const [result] = await pool.query(
      `INSERT INTO reports (alarm_id, report_date, report_number, created_by, created_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [alarm_id, report_date, report_number || null, created_by || null]
    );

    res.status(201).json({
      id: result.insertId,
      alarm_id,
      report_date,
      report_number,
      created_by
    });
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({ error: 'Failed to create report' });
  }
});

// PUT update report
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { report_date, report_number } = req.body;

    const [result] = await pool.query(
      `UPDATE reports 
       SET report_date = ?, report_number = ?
       WHERE id = ?`,
      [report_date || null, report_number || null, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.json({ message: 'Report updated successfully' });
  } catch (error) {
    console.error('Error updating report:', error);
    res.status(500).json({ error: 'Failed to update report' });
  }
});

// DELETE report
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query(
      'DELETE FROM reports WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.json({ message: 'Report deleted successfully' });
  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({ error: 'Failed to delete report' });
  }
});

// GET reports for specific alarm
router.get('/alarm/:alarmId', async (req, res) => {
  try {
    const [reports] = await pool.query(
      `SELECT 
         r.id,
         r.alarm_id,
         r.report_date,
         r.report_number,
         r.created_by,
         r.created_at,
         f.name as created_by_name,
         f.surname as created_by_surname
       FROM reports r
       LEFT JOIN firefighters f ON r.created_by = f.id
       WHERE r.alarm_id = ?
       ORDER BY r.created_at DESC`,
      [req.params.alarmId]
    );
    res.json(reports);
  } catch (error) {
    console.error('Error fetching reports for alarm:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

router.get('/:id/pdf', async (req, res) => {
  try {
    const reportId = req.params.id;

    const [reports] = await pool.query(
      `SELECT 
         r.id,
         r.alarm_id,
         r.report_date,
         r.report_number,
         r.created_by,
         r.created_at,
         a.alarm_time,
         a.end_time,
         a.alarm_type,
         a.location,
         f.name as created_by_name,
         f.surname as created_by_surname
       FROM reports r
       LEFT JOIN alarms a ON r.alarm_id = a.id
       LEFT JOIN firefighters f ON r.created_by = f.id
       WHERE r.id = ?`,
      [reportId]
    );

    if (reports.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const report = reports[0];

    const [crew] = await pool.query(
      `SELECT 
         ac.position,
         ff.id,
         ff.name,
         ff.surname,
         ff.locality,
         ff.street,
         ff.house_number
       FROM alarm_crew ac
       LEFT JOIN firefighters ff ON ac.firefighter_id = ff.id
       WHERE ac.alarm_id = ?
       ORDER BY FIELD(ac.position, 'Kierowca', 'Dowodca') DESC, ac.position ASC`,
      [report.alarm_id]
    );

    const doc = new PDFDocument({ 
      margin: 50, 
      size: 'A4',
      bufferPages: true,
      info: {
        Title: 'Wniosek o ekwiwalent',
        Author: 'OSP'
      }
    });

    doc.registerFont('Regular', regularFont);
    doc.registerFont('Bold', boldFont);
    doc._font = doc._registeredFonts['Regular'];
    doc._fontFamily = 'Regular';

    doc.font('Regular');

    res.setHeader('Content-Type', 'application/pdf; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="WNIOSEK_EKWIWALENT_${report.report_number || report.id}.pdf"`);


    doc.pipe(res);

    doc.fontSize(9)
       .text('Załącznik nr 1 do Zarządzenia Nr 27', { align: 'right' });
    doc.text('Wójta Gminy Łososina Dolna z dnia 15 lutego 2023 r.', { align: 'right' });
    
    doc.moveDown(2);

    doc.fontSize(9)
       .text('(pieczęć Ochotniczej Straży Pożarnej)', 50, doc.y);
    
    doc.moveDown(1);

    const today = new Date();
    doc.fontSize(10)
       .text(`Łososina Dolna, dn. ${today.getDate()}.${(today.getMonth() + 1).toString().padStart(2, '0')}.${today.getFullYear()}`, { align: 'right' });
    
    doc.moveDown(2);

    doc.fontSize(11)
       .font('Bold')
       .text('Wójta Gminy Łososina Dolna', { align: 'right' });
    
    doc.fontSize(12)
       .text('Wniosek', { align: 'center' });
    
    doc.moveDown(0.5);

    doc.fontSize(10)
       .font('Regular')
       .text('o wypłat ekwiwalentu pieniężnego za udział w ', { continued: true })
       .font('Bold')
       .text('działaniu ratowniczym/akcji ratowniczej/', { continued: false })
       .text('szkoleniu lub ćwiczeniu', { continued: true });
       doc.font('Regular')
       .text(` w miejscowości       `, { continued: true })
        .font('Bold')
        .text(`${report.location || '_____________________'}`, { continued: false });
    
    const alarmDate = new Date(report.alarm_time);
    const alarmDateStr = `${alarmDate.getDate()}.${(alarmDate.getMonth() + 1).toString().padStart(2, '0')}.${alarmDate.getFullYear()}`;
    doc.font('Regular')
    doc.text(`w dniu `,{ continued: true })
        .font('Bold')
        .text(`${alarmDateStr}`, { continued: false });
    
    doc.moveDown(1);

    doc.fontSize(9)
       .text('_________________________________________________________________________', { align: 'center' })
       .text('(Opis działań ratowniczych/akcji ratowniczej/ szkolenia lub ćwiczenia)', { align: 'center' });
    
    doc.moveDown(1);

    const tableTop = doc.y;
    const col1X = 50;
    const col2X = 80;
    const col3X = 220;
    const col4X = 330;
    const col5X = 440;
    const rowHeight = 30;

    doc.fontSize(9)
       .font('Bold');
    
    doc.rect(col1X, tableTop, 30, rowHeight).stroke();
    doc.rect(col2X, tableTop, 140, rowHeight).stroke();
    doc.rect(col3X, tableTop, 110, rowHeight).stroke();
    doc.rect(col4X, tableTop, 110, rowHeight).stroke();
    doc.rect(col5X, tableTop, 105, rowHeight).stroke();

    doc.text('Lp.', col1X + 2, tableTop + 12, { width: 26, align: 'center' });
    doc.text('Imię i nazwisko\nczłonka OSP', col2X + 5, tableTop + 6, { width: 130, align: 'center' });
    doc.text('Adres\nzamieszkania', col3X + 5, tableTop + 6, { width: 100, align: 'center' });
    doc.text('Czas udziału w\ndziałaniu ratowniczym', col4X + 5, tableTop + 6, { width: 100, align: 'center' });
    doc.text('Podpis członka OSP', col5X + 5, tableTop + 6, { width: 95, align: 'center' });

    doc.font('Regular');
    let currentY = tableTop + rowHeight;

    const maxRows = Math.max(10, crew.length);
    
    for (let i = 0; i < maxRows; i++) {
      const member = crew[i];
      
      doc.rect(col1X, currentY, 30, rowHeight).stroke();
      doc.rect(col2X, currentY, 140, rowHeight).stroke();
      doc.rect(col3X, currentY, 110, rowHeight).stroke();
      doc.rect(col4X, currentY, 110, rowHeight).stroke();
      doc.rect(col5X, currentY, 105, rowHeight).stroke();

      if (member) {
        const address = `${member.locality || ''} ${member.house_number || ''} `.trim();
        
        const startTime = new Date(report.alarm_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
        const endTime = report.end_time ? new Date(report.end_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '__:__';
        const timeRange = `${startTime} - ${endTime}`;

        doc.fontSize(9)
           .text((i + 1).toString(), col1X + 2, currentY + 10, { width: 26, align: 'center' });
        doc.text(`${member.name || ''} ${member.surname || ''}`, col2X + 5, currentY + 10, { width: 130, align: 'center' });
        doc.text(address || '', col3X + 5, currentY + 10, { width: 100, align: 'center' });
        doc.text(timeRange, col4X + 5, currentY + 10, { width: 100, align: 'center' });
      } else {
        doc.fontSize(9)
           .text((i + 1).toString(), col1X + 2, currentY + 10, { width: 26, align: 'center' });
      }

      currentY += rowHeight;

      if (currentY > 700 && i < maxRows - 1) {
        doc.addPage();
        currentY = 50;
      }
    }

    doc.moveDown(2);
    currentY += 10;

    doc.fontSize(8)
       .font('Regular')
       .text('Oświadczamy, że wyżej wymienieni strażacy ratownicy OSP posiadają prawo do bezpośredniego udziału w działaniach ratowniczych zgodnie z art. 8 ustawy z dnia 17 grudnia 2021 r. o ochotniczych strażach pożarnych oraz, że brali udział w działaniach ratowniczych/akcji ratowniczej/ szkoleniu lub ćwiczeniu zgodnie z wyżej przedstawionym wykazem.', 
            50, currentY, { width: 495, align: 'justify' });
    
    currentY += 30;

    doc.fontSize(9)
       .text('Potwierdzamy prawdziwość w/w danych przedstawionych we wniosku.', 50, currentY, { width: 495 });
    
    currentY += 50;

    doc.fontSize(9);
    doc.text('Data i podpis  Prezesa OSP', 70, currentY, { width: 200 });
    doc.text('data i podpis Dowódcy akcji', 350, currentY, { width: 200 });
    
    currentY += 40;

    doc.fontSize(7)
       .text('niepotrzebne skreślić', 50, currentY, { width: 495 });

    doc.end();
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

module.exports = router;
