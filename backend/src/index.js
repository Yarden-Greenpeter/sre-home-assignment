require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const log4js = require('log4js');
const authRoutes = require('./routes/auth');
const protectedRoutes = require('./routes/protected');
const { connectDB } = require('./models/db');
const kafkaService = require('./services/kafka-service');
const cdcService = require('./services/cdc-service');

const app = express();
const PORT = process.env.PORT || 3000;

// Setup logging
log4js.configure({
  appenders: {
    out: { type: 'stdout' },
    app: { type: 'file', filename: 'logs/app.log' }
  },
  categories: {
    default: { appenders: ['out', 'app'], level: 'info' }
  }
});

const logger = log4js.getLogger();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true
}));

// Body parsing middleware
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// Logging middleware
app.use(log4js.connectLogger(logger, { level: 'auto' }));

// Audit logging middleware
app.use((req, res, next) => {
  const originalSend = res.send;
  res.send = function(body) {
    // Log API calls to Kafka
    const success = res.statusCode < 400;
    const email = req.user ? req.user.email : null;
    
    kafkaService.publishAuditLog(
      email,
      `${req.method} ${req.path}`,
      req.ip,
      req.get('User-Agent'),
      success,
      success ? null : body
    );
    
    return originalSend.call(this, body);
  };
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/protected', protectedRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Backend is healthy',
    timestamp: new Date().toISOString(),
    services: {
      database: 'connected',
      kafka: kafkaService.isConnected ? 'connected' : 'disconnected'
    }
  });
});

// Main endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'SRE Home Assignment Backend Running',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    code: 'SERVER_ERROR'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    code: 'NOT_FOUND'
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await kafkaService.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await kafkaService.disconnect();
  process.exit(0);
});

// Start Server
async function startServer() {
  try {
    await connectDB();
    await kafkaService.connect();
    await cdcService.start();
    
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  } catch (err) {
    logger.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();