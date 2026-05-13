import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../utils/logger';
import { env } from '../config/environment';

/**
 * Custom error classes for different error types
 */
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational: boolean = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(400, message);
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(401, message);
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Access forbidden') {
    super(403, message);
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(404, message);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string = 'Database operation failed') {
    super(500, message);
    Object.setPrototypeOf(this, DatabaseError.prototype);
  }
}

export class ExternalServiceError extends AppError {
  constructor(message: string = 'External service unavailable') {
    super(503, message);
    Object.setPrototypeOf(this, ExternalServiceError.prototype);
  }
}

/**
 * Global error handling middleware
 * Handles different error types and returns standardized error responses
 * Logs errors with stack traces in development mode
 */
export function errorHandler(
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Default error values
  let statusCode = 500;
  let message = 'Internal server error';
  let isOperational = false;

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    statusCode = 400;
    const fieldErrors = error.errors.map(err => {
      const field = err.path.join('.');
      return `${field}: ${err.message}`;
    });
    message = `Validation error: ${fieldErrors.join(', ')}`;
    isOperational = true;
  }
  // Handle custom application errors
  else if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
    isOperational = error.isOperational;
  }
  // Handle Supabase/PostgreSQL errors
  else if (error.message.includes('duplicate key') || error.message.includes('violates')) {
    statusCode = 409;
    message = 'Resource conflict - duplicate entry or constraint violation';
    isOperational = true;
  }
  // Handle JSON parsing errors
  else if (error instanceof SyntaxError && 'body' in error) {
    statusCode = 400;
    message = 'Invalid JSON in request body';
    isOperational = true;
  }
  // Handle generic errors
  else {
    message = env.NODE_ENV === 'development' ? error.message : 'Internal server error';
  }

  // Log error
  if (!isOperational || statusCode >= 500) {
    logger.error(`Error ${statusCode}: ${message}`, error);
  } else if (env.NODE_ENV === 'development') {
    logger.warn(`Error ${statusCode}: ${message}`);
  }

  // Send error response
  const errorResponse: any = {
    success: false,
    error: message,
    timestamp: new Date().toISOString(),
  };

  // Include stack trace in development mode
  if (env.NODE_ENV === 'development' && error.stack) {
    errorResponse.stack = error.stack;
  }

  res.status(statusCode).json(errorResponse);
}

/**
 * Middleware to handle 404 errors for undefined routes
 */
export function notFoundHandler(req: Request, res: Response, next: NextFunction): void {
  const error = new NotFoundError(`Route ${req.method} ${req.path} not found`);
  next(error);
}

/**
 * Async handler wrapper to catch errors in async route handlers
 * Eliminates need for try-catch in every async handler
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
