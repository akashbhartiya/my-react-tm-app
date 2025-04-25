export function initializeDatabase(db) {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('team_member', 'manager')),
      team TEXT NOT NULL,
      avatar TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Leave requests table
  db.exec(`
    CREATE TABLE IF NOT EXISTS leave_requests (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      leave_type TEXT NOT NULL CHECK (leave_type IN ('vacation', 'sick', 'personal', 'other')),
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
      reason TEXT,
      manager_comment TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    );
  `);

  // Events table
  db.exec(`
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      event_type TEXT NOT NULL CHECK (event_type IN ('after_work', 'all_hands', 'celebration', 'training', 'other')),
      start_time DATETIME NOT NULL,
      end_time DATETIME NOT NULL,
      description TEXT,
      created_by TEXT NOT NULL,
      visibility TEXT NOT NULL CHECK (visibility IN ('team', 'department', 'all', 'custom')),
      rsvp_required BOOLEAN NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users (id)
    );
  `);

  // Event RSVPs table
  db.exec(`
    CREATE TABLE IF NOT EXISTS event_rsvps (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      response TEXT NOT NULL CHECK (response IN ('attending', 'maybe', 'not_attending')),
      responded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (event_id) REFERENCES events (id),
      FOREIGN KEY (user_id) REFERENCES users (id),
      UNIQUE (event_id, user_id)
    );
  `);

  // Notifications table
  db.exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error')),
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      read BOOLEAN NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    );
  `);

  // Insert demo users if they don't exist
  const stmt = db.prepare('SELECT COUNT(*) as count FROM users');
  const { count } = stmt.get();

  if (count === 0) {
    const insertUser = db.prepare(`
      INSERT INTO users (id, name, email, password, role, team, avatar)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    // Demo manager
    insertUser.run(
      '1',
      'John Manager',
      'manager@example.com',
      '$2a$10$xVfq0iBzZ7.hW8zLV7EkKe8mZqXQy0/1Eqh1yQdH2GHN0gNO3vX2q', // hashed 'password'
      'manager',
      'Engineering',
      'https://i.pravatar.cc/150?img=1'
    );

    // Demo employee
    insertUser.run(
      '2',
      'Jane Employee',
      'employee@example.com',
      '$2b$12$6/.lSixxbP5aawaifDapLeiNjWC77oKTvHUnP.azg2QeILAs9SvBm', // hashed 'password'
      'team_member',
      'Engineering',
      'https://i.pravatar.cc/150?img=2'
    );
  }
}