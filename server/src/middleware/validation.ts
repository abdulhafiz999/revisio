import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { sanitizeObject } from '../utils/sanitizer';

/**
 * Validation target - which part of the request to validate
 */
export type ValidationTarget = 'body' | 'query' | 'params';

/**
 * Middleware factory for request validation using Zod schemas
 * Validates and sanitizes request data before it reaches the controller
 * 
 * @param schema - Zod schema to validate against
 * @param target - Which part of the request to validate (body, query, or params)
 * @returns Express middleware function
 */
export function validate(schema: ZodSchema, target: ValidationTarget = 'body') {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Get the data to validate based on target
      const dataToValidate = req[target];
      
      // Sanitize the data before validation
      const sanitizedData = sanitizeObject(dataToValidate);
      
      // Validate using Zod schema
      const validatedData = await schema.parseAsync(sanitizedData);
      
      // Replace the request data with validated and sanitized data
      req[target] = validatedData;
      
      // Continue to next middleware
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Format validation errors
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors,
          timestamp: new Date().toISOString(),
        });
      } else {
        // Pass other errors to error handler
        next(error);
      }
    }
  };
}

/**
 * Middleware to validate request body
 */
export function validateBody(schema: ZodSchema) {
  return validate(schema, 'body');
}

/**
 * Middleware to validate query parameters
 */
export function validateQuery(schema: ZodSchema) {
  return validate(schema, 'query');
}

/**
 * Middleware to validate route parameters
 */
export function validateParams(schema: ZodSchema) {
  return validate(schema, 'params');
}
