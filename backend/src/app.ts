import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

import { projectRoutes } from './routes/projects';
import { uploadRoutes } from './routes/uploads';
import { reconciliationRoutes } from './routes/reconciliations';
import { settingsRoutes } from './routes/settings';
import { errorHandler } from './middleware/errorHandler';

export const createApp = () => {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Ensure uploads directory exists
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Routes
  app.use('/api/projects', projectRoutes);
  app.use('/api/uploads', uploadRoutes);
  app.use('/api/reconciliations', reconciliationRoutes);
  app.use('/api/settings', settingsRoutes);

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
  });

  // Error handler (must be last)
  app.use(errorHandler);

  return app;
};
