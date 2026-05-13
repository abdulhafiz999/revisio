import { Request, Response, NextFunction } from 'express';
import { supabaseAnon } from '../config/database';

/**
 * Extended Request interface with authenticated user information
 */
export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
  };
}

/**
 * Authentication middleware that verifies JWT tokens from Supabase Auth
 * Extracts Bearer token from Authorization header and validates it
 * Attaches user information to the request object for downstream handlers
 */
export async function verifyToken(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Extract Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({
        success: false,
        error: 'Authorization header is required',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Check for Bearer token format
    if (!authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'Authorization header must use Bearer scheme',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Extract token from "Bearer <token>"
    const token = authHeader.substring(7);

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Token is required',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Verify token with Supabase Auth
    const { data, error } = await supabaseAnon.auth.getUser(token);

    if (error || !data.user) {
      res.status(401).json({
        success: false,
        error: 'Invalid or expired token',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Attach user information to request object
    (req as AuthenticatedRequest).user = {
      id: data.user.id,
      email: data.user.email || '',
    };

    // Continue to next middleware/handler
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Authentication failed',
      timestamp: new Date().toISOString(),
    });
  }
}
