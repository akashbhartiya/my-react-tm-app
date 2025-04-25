import express from 'express';
import { authenticateToken, isManager } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Get all leave requests (managers only)
router.get('/', authenticateToken, isManager, (req, res) => {
  try {
    const stmt = req.db.prepare(`
      SELECT lr.*, u.name as user_name, u.team as user_team
      FROM leave_requests lr
      JOIN users u ON lr.user_id = u.id
      ORDER BY lr.created_at DESC
    `);
    const leaves = stmt.all();
    res.json(leaves);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch leave requests' });
  }
});

// Get user's leave requests
router.get('/my-leaves', authenticateToken, (req, res) => {
  try {
    const stmt = req.db.prepare(`
      SELECT *
      FROM leave_requests
      WHERE user_id = ?
      ORDER BY created_at DESC
    `);
    const leaves = stmt.all(req.user.id);
    res.json(leaves);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch your leave requests' });
  }
});

// Create leave request
router.post('/', authenticateToken, (req, res) => {
  const { leaveType, startDate, endDate, reason } = req.body;

  try {
    const stmt = req.db.prepare(`
      INSERT INTO leave_requests (
        id, user_id, leave_type, start_date, end_date, status, reason
      )
      VALUES (?, ?, ?, ?, ?, 'pending', ?)
    `);

    const result = stmt.run(
      uuidv4(),
      req.user.id,
      leaveType,
      startDate,
      endDate,
      reason
    );

    if (result.changes > 0) {
      res.status(201).json({ message: 'Leave request created successfully' });
    } else {
      res.status(400).json({ error: 'Failed to create leave request' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create leave request' });
  }
});

// Update leave request status (managers only)
router.patch('/:id', authenticateToken, isManager, (req, res) => {
  const { status, comment } = req.body;

  try {
    const stmt = req.db.prepare(`
      UPDATE leave_requests
      SET status = ?, manager_comment = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    const result = stmt.run(status, comment, req.params.id);

    if (result.changes > 0) {
      res.json({ message: 'Leave request updated successfully' });
    } else {
      res.status(404).json({ error: 'Leave request not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update leave request' });
  }
});

export default router;