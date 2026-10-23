import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config();

import { testConnection } from './config/db.js';
import bookRoutes from './routes/bookRoutes.js';
import memberRoutes from './routes/memberRoutes.js';
import issueRoutes from './routes/issueRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable Cross-Origin Resource Sharing for frontend
app.use(cors());

// Parse incoming JSON and URL-encoded requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'Library Management System API'
  });
});

// Mount modular API routes
app.use('/api/books', bookRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/issues', issueRoutes);
app.use('/api/dashboard', dashboardRoutes);

// 404 handler for undefined API routes
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`
  });
});

// Centralized error handler
app.use(errorHandler);

// Start Server after testing database connection
const startServer = async () => {
  await testConnection();
  app.listen(PORT, () => {
    console.log(`🚀 Library Management Backend running on http://localhost:${PORT}`);
  });
};

startServer();
