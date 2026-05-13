import { app } from './app';
import { env } from './config/environment';
import { logger } from './utils/logger';

/**
 * Server entry point
 * Loads environment configuration, starts the Express server,
 * and handles uncaught exceptions and unhandled rejections
 */

// ============================================================================
// Global Error Handlers
// ============================================================================

/**
 * Handle uncaught exceptions
 * Log the error and exit the process
 */
process.on('uncaughtException', (error: Error) => {
  logger.error('UNCAUGHT EXCEPTION! Shutting down...', error);
  logger.error(`Error: ${error.message}`);
  logger.error(`Stack: ${error.stack}`);
  process.exit(1);
});

/**
 * Handle unhandled promise rejections
 * Log the error and exit the process
 */
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  logger.error('UNHANDLED REJECTION! Shutting down...', reason);
  logger.error(`Promise: ${promise}`);
  logger.error(`Reason: ${reason}`);
  process.exit(1);
});

// ============================================================================
// Server Startup
// ============================================================================

/**
 * Start the Express server
 */
function startServer(): void {
  try {
    // Validate environment configuration
    // This will throw an error if required variables are missing
    logger.info('Validating environment configuration...');
    logger.info(`Environment: ${env.NODE_ENV}`);
    logger.info(`Port: ${env.PORT}`);
    logger.info(`Frontend URL: ${env.FRONTEND_URL}`);
    logger.info(`Supabase URL: ${env.SUPABASE_URL}`);
    logger.info(`Gemini API Key: ${env.GEMINI_API_KEY ? '***configured***' : 'NOT SET'}`);

    // Start listening on the configured port
    const server = app.listen(env.PORT, () => {
      logger.info('='.repeat(60));
      logger.info(`🚀 Server started successfully!`);
      logger.info(`📍 Environment: ${env.NODE_ENV}`);
      logger.info(`🌐 Server running on port ${env.PORT}`);
      logger.info(`🔗 API available at: http://localhost:${env.PORT}`);
      logger.info(`🏥 Health check: http://localhost:${env.PORT}/health`);
      logger.info('='.repeat(60));
    });

    // Handle graceful shutdown
    const gracefulShutdown = (signal: string) => {
      logger.info(`\n${signal} received. Starting graceful shutdown...`);
      
      server.close(() => {
        logger.info('HTTP server closed');
        logger.info('Graceful shutdown completed');
        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    // Listen for termination signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();
