import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import { pool } from './config/db.js';
import router from './routes/index.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';
import { cleanupExpiredTokens } from './utils/tokenCleanup.js';
import { startTokenCleanupScheduler, startTokenStatsLogger } from './utils/scheduler.js';

const app: Application = express();

// Securtiy and Performance Middlewares 
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting 
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 request per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many request from this IP, please try again later.',
  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      error: 'To many request from this IP, please try again later.',
    })
  }
});
app.use('/api', limiter);

// Health check point 
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: 'connected',
  });
});

// API Routes 
app.use('/api', router);

// Error handler
app.use(notFoundHandler);
app.use(errorHandler);


async function startServer() {
  try {
    // Test db connection
    await pool.query('SELECT NOW()');
    console.log('Database connected');

    // Cleanup  expired  toke s on startup 
    const deletedOnStartup = await cleanupExpiredTokens();
    if (deletedOnStartup > 0) {
      console.log(`Cleaned up ${deletedOnStartup} expired token(s) startup`);
    }

    // Start automatic cleanup scheduler
    startTokenCleanupScheduler();
    startTokenStatsLogger();

    // Running Server 
    const PORT = env.server.port;
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`Environment: ${env.server.nodeEnv}`);
      console.log(`API base: http://localhost:${PORT}/api`);
      console.log(`Health: http://localhost:${PORT}/health`);
    });
  } catch (err) {
    console.error('Failed to running server:', err);
    process.exit(-1);
  }
}

startServer();

