import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createApp } from './app';

dotenv.config();

const PORT = process.env.PORT || 3001;

const startServer = async () => {
  try {
    const app = createApp();
    
    app.listen(PORT, () => {
      console.log(`\n🚀 GST Reconciliation Server running on http://localhost:${PORT}`);
      console.log(`📊 API Base: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
