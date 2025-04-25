import express from 'express';
import listEndpoints from 'express-list-endpoints';
import cors from 'cors';
import dotenv from 'dotenv';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import authRoutes from './routes/auth.js';
import leaveRoutes from './routes/leaves.js';
import eventRoutes from './routes/events.js';
import notificationRoutes from './routes/notifications.js';
import { initializeDatabase } from './db/init.js';

// Configure environment variables
dotenv.config();

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Express app
const app = express();
const port = process.env.PORT || 3000;

// Initialize database
const db = new Database(join(__dirname, 'db/timesync.db'), { verbose: console.log });
initializeDatabase(db);

// Configure CORS with specific options
app.use(cors({
  origin: 'http://localhost:5173', // Allow requests from the Vite dev server
  credentials: true, // Allow credentials (cookies, authorization headers)
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'], // Allowed HTTP methods
  allowedHeaders: ['Content-Type', 'Authorization'] // Allowed headers
}));

app.use(express.json());

// Make database instance available to routes
app.use((req, res, next) => {
  req.db = db;
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/notifications', notificationRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(port, () => {
  console.log(listEndpoints(app));
  console.log(`Server running on port ${port}`);
});