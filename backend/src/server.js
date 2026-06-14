require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/database');
const logger = require('./utils/logger');

const PORT = parseInt(process.env.PORT) || 5000;

// ─── Unhandled Promise Rejections ────────────────────────────────────────────
process.on('unhandledRejection', (reason, promise) => {
  logger.error(`Unhandled Rejection at: ${promise} - reason: ${reason}`);
  // Don't exit in development to allow debugging
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

// ─── Uncaught Exceptions ─────────────────────────────────────────────────────
process.on('uncaughtException', (error) => {
  logger.error(`Uncaught Exception: ${error.message}`, { stack: error.stack });
  process.exit(1);
});

// ─── Graceful Shutdown ───────────────────────────────────────────────────────
const gracefulShutdown = (signal) => {
  logger.info(`${signal} received. Shutting down gracefully...`);
  server.close(() => {
    logger.info('HTTP server closed.');
    const mongoose = require('mongoose');
    mongoose.connection.close(false, () => {
      logger.info('MongoDB connection closed.');
      process.exit(0);
    });
  });

  // Force exit after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

// ─── Start Server ────────────────────────────────────────────────────────────
const startServer = async () => {
  try {
    // Connect to MongoDB first
    await connectDB();

    const server = app.listen(PORT, () => {
      logger.info(`
╔═══════════════════════════════════════════╗
║         LinkPulse API Server              ║
║─────────────────────────────────────────║
║  Status:  Running                         ║
║  Port:    ${PORT}                              ║
║  Mode:    ${process.env.NODE_ENV || 'development'}                   ║
║  URL:     http://localhost:${PORT}           ║
╚═══════════════════════════════════════════╝
      `);
    });

    // Handle graceful shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    return server;
  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

const server = startServer();

module.exports = server;
