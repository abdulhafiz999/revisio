import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { registerSchema, loginSchema, resetPasswordSchema, updatePasswordSchema } from '../models/schemas';


/**
 * Authentication Controller
 * Handles HTTP requests for authentication operations
 */
export class AuthController {
  /**
   * Register a new user
   * POST /api/auth/register
   */
  async register(req: Request, res: Response): Promise<void> {
    try {
      // Validate request body
      const validatedData = registerSchema.parse(req.body);

      // Call auth service
      const result = await authService.register(validatedData);

      // Return success response
      res.status(200).json({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      // Handle validation errors
      if (error instanceof Error) {
        if (error.message === 'Email already exists') {
          res.status(409).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString(),
          });
          return;
        }

        res.status(500).json({
          success: false,
          error: error.message,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Registration failed',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Login user
   * POST /api/auth/login
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      // Validate request body
      const validatedData = loginSchema.parse(req.body);

      // Call auth service
      const result = await authService.login(validatedData);

      // Return success response
      res.status(200).json({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      // Handle authentication errors
      if (error instanceof Error) {
        if (error.message === 'Invalid email or password') {
          res.status(401).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString(),
          });
          return;
        }

        res.status(400).json({
          success: false,
          error: error.message,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Login failed',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Logout user
   * POST /api/auth/logout
   */
  async logout(req: Request, res: Response): Promise<void> {
    try {
      // Extract token from Authorization header
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
          success: false,
          error: 'Authorization header is required',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const token = authHeader.substring(7);

      // Call auth service
      await authService.logout(token);

      // Return success response
      res.status(200).json({
        success: true,
        data: null,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(401).json({
          success: false,
          error: error.message,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Logout failed',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Request password reset
   * POST /api/auth/reset-password
   */
  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      // Validate request body
      const validatedData = resetPasswordSchema.parse(req.body);

      // Call auth service
      const result = await authService.resetPassword(validatedData);

      // Return success response
      res.status(200).json({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({
          success: false,
          error: error.message,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Password reset request failed',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Update user password
   * POST /api/auth/update-password
   */
  async updatePassword(req: Request, res: Response): Promise<void> {
    try {
      // Validate request body
      const validatedData = updatePasswordSchema.parse(req.body);

      // Extract token from Authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
          success: false,
          error: 'Authorization header is required',
          timestamp: new Date().toISOString(),
        });
        return;
      }
      const token = authHeader.substring(7);

      // Call auth service
      const result = await authService.updatePassword(token, validatedData.password);

      // Return success response
      res.status(200).json({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({
          success: false,
          error: error.message,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Password update failed',
        timestamp: new Date().toISOString(),
      });
    }
  }
}

// Export singleton instance
export const authController = new AuthController();
