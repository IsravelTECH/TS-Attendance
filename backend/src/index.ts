import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import visitsRoutes from './routes/visits.routes';
import schoolsRoutes from './routes/schools.routes';
import employeesRoutes from './routes/employees.routes';
import integrationsRoutes from './routes/integrations.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend web and mobile access
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Increase JSON limit to 15mb to handle direct camera photo uploads
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Request logger
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    service: 'Techno School: Field Sales Attendance & Dual-Photo Verification Engine',
    version: '2.0.0',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/visits', visitsRoutes);
app.use('/api/schools', schoolsRoutes);
app.use('/api/employees', employeesRoutes);
app.use('/api/integrations', integrationsRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'API Endpoint not found.' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`📍 Techno School Field Sales Attendance API Running!`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`🩺 Health: http://localhost:${PORT}/health`);
  console.log(`🔑 Demo Accounts: http://localhost:${PORT}/api/auth/demo-accounts`);
  console.log(`====================================================`);
});

export default app;
