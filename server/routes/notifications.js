import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Get user's notifications
router.get('/', authenticateToken, (req, res) => {
  try {
    const stmt = req.db.prepare(`
      SELECT *
      FROM notifications
      WHERE user_id = ?
      ORDER BY created_at DESC
    `);
    const notifications = stmt.all(req.user.id);
    res.json(notifications);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Create notification
router.post('/', authenticateToken, (req, res) => {
  const { userId, type, title, message } = req.body;

  try {
    const stmt = req.db.prepare(`
      INSERT INTO notifications (id, user_id, type, title, message)
      VALUES (?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      uuidv4(),
      userId,
      type,
      title,
      message
    );

    if (result.changes > 0) {
      res.status(201).json({ message: 'Notification created successfully' });
    } else {
      res.status(400).json({ error: 'Failed to create notification' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create notification' });
  }
});

// Mark notification as read
router.patch('/:id/read', authenticateToken, (req, res) => {
  try {
    const stmt = req.db.prepare(`
      UPDATE notifications
      SET read = 1
      WHERE id = ? AND user_id = ?
    `);

    const result = stmt.run(req.params.id, req.user.id);

    if (result.changes > 0) {
      res.json({ message: 'Notification marked as read' });
    } else {
      res.status(404).json({ error: 'Notification not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

// Mark all notifications as read
router.post('/mark-all-read', authenticateToken, (req, res) => {
  try {
    const stmt = req.db.prepare(`
      UPDATE notifications
      SET read = 1
      WHERE user_id = ? AND read = 0
    `);

    const result = stmt.run(req.user.id);
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update notifications' });
  }
});

// Delete notification
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const stmt = req.db.prepare(`
      DELETE FROM notifications
      WHERE id = ? AND user_id = ?
    `);

    const result = stmt.run(req.params.id, req.user.id);

    if (result.changes > 0) {
      res.json({ message: 'Notification deleted successfully' });
    } else {
      res.status(404).json({ error: 'Notification not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

export default router;