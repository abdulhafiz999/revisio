import express, { Application } from 'express';
import cors from 'cors';
import { corsOptions } from './config/cors';
import { helmetConfig } from './config/security';
import { rateLimiter } from './middleware/rateLimiter';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';

// Import route modules
import authRoutes from './routes/auth.routes';
import attemptsRoutes from './routes/attempts.routes';
import progressRoutes from './routes/progress.routes';
import notesRoutes from './routes/notes.routes';
import aiRoutes from './routes/ai.routes';

/**
 * Configure and initialize Express application
 * Sets up middleware, routes, and error handling
 */
export function createApp(): Application {
  const app = express();

  // ============================================================================
  // Middleware Configuration
  // ============================================================================

  // Security headers - must be applied early
  app.use(helmetConfig);

  // CORS configuration - allow requests from frontend
  app.use(cors(corsOptions));

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' })); // Parse JSON bodies
  app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Parse URL-encoded bodies

  // Rate limiting - apply to all routes
  app.use(rateLimiter);

  // Request logging in development
  app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path}`);
    next();
  });

  // ============================================================================
  // Health Check Endpoint
  // ============================================================================

  app.get('/health', (req, res) => {
    res.status(200).json({
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      },
    });
  });

  // ============================================================================
  // API Routes
  // ============================================================================

  // Mount route modules under /api prefix
  app.use('/api/auth', authRoutes);
  app.use('/api/attempts', attemptsRoutes);
  app.use('/api/users', progressRoutes); // Progress routes are under /api/users
  app.use('/api/notes', notesRoutes);
  app.use('/api/ai', aiRoutes);

  // TODO: Add these routes when tasks 6 and 7 are completed
  // app.use('/api/courses', coursesRoutes);
  // app.use('/api/questions', questionsRoutes);
  // app.use('/api/topics', topicsRoutes);

  // ============================================================================
  // Error Handling
  // ============================================================================

  // Handle 404 errors for undefined routes
  app.use(notFoundHandler);

  // Global error handler - must be last middleware
  app.use(errorHandler);

  return app;
}

// Export configured app instance
export const app = createApp();
