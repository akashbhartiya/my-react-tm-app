import express from 'express';
import { authenticateToken, isManager } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Get all events
router.get('/', authenticateToken, (req, res) => {
  try {
    const stmt = req.db.prepare(`
      SELECT e.*, u.name as created_by_name
      FROM events e
      JOIN users u ON e.created_by = u.id
      ORDER BY e.start_time ASC
    `);
    const events = stmt.all();
    res.json(events);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// Create event (managers only)
router.post('/', authenticateToken, isManager, (req, res) => {
  const {
    title,
    eventType,
    startTime,
    endTime,
    description,
    visibility,
    rsvpRequired
  } = req.body;

  try {
    const stmt = req.db.prepare(`
      INSERT INTO events (
        id, title, event_type, start_time, end_time,
        description, created_by, visibility, rsvp_required
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      uuidv4(),
      title,
      eventType,
      startTime,
      endTime,
      description,
      req.user.id,
      visibility,
      rsvpRequired ? 1 : 0
    );

    if (result.changes > 0) {
      res.status(201).json({ message: 'Event created successfully' });
    } else {
      res.status(400).json({ error: 'Failed to create event' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// Get event RSVPs
router.get('/:id/rsvps', authenticateToken, (req, res) => {
  try {
    const stmt = req.db.prepare(`
      SELECT er.*, u.name as user_name
      FROM event_rsvps er
      JOIN users u ON er.user_id = u.id
      WHERE er.event_id = ?
    `);
    const rsvps = stmt.all(req.params.id);
    res.json(rsvps);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch RSVPs' });
  }
});

// Submit RSVP
router.post('/:id/rsvp', authenticateToken, (req, res) => {
  const { response } = req.body;

  try {
    const stmt = req.db.prepare(`
      INSERT INTO event_rsvps (id, event_id, user_id, response)
      VALUES (?, ?, ?, ?)
      ON CONFLICT (event_id, user_id)
      DO UPDATE SET response = excluded.response, responded_at = CURRENT_TIMESTAMP
    `);

    const result = stmt.run(
      uuidv4(),
      req.params.id,
      req.user.id,
      response
    );

    if (result.changes > 0) {
      res.json({ message: 'RSVP submitted successfully' });
    } else {
      res.status(400).json({ error: 'Failed to submit RSVP' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to submit RSVP' });
  }
});

export default router;