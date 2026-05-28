import { Router } from 'express';
import { authController } from '../controllers/auth.controller';

/**
 * Authentication Routes
 * Defines all authentication-related endpoints
 */
const router = Router();

/**
 * POST /api/auth/register
 * Register a new user with email and password
 * 
 * Request body:
 * {
 *   email: string,
 *   password: string (min 8 characters)
 * }
 * 
 * Response:
 * {
 *   success: true,
 *   data: {
 *     user: { id, email, created_at, updated_at },
 *     session: { access_token, refresh_token, expires_at }
 *   },
 *   timestamp: string
 * }
 * 
 * Errors:
 * - 400: Invalid request body
 * - 409: Email already exists
 */
router.post('/register', (req, res) => authController.register(req, res));

/**
 * POST /api/auth/login
 * Authenticate user with email and password
 * 
 * Request body:
 * {
 *   email: string,
 *   password: string
 * }
 * 
 * Response:
 * {
 *   success: true,
 *   data: {
 *     user: { id, email, created_at, updated_at },
 *     session: { access_token, refresh_token, expires_at }
 *   },
 *   timestamp: string
 * }
 * 
 * Errors:
 * - 400: Invalid request body
 * - 401: Invalid credentials
 */
router.post('/login', (req, res) => authController.login(req, res));

/**
 * POST /api/auth/logout
 * Logout user and invalidate session
 * 
 * Headers:
 * Authorization: Bearer <access_token>
 * 
 * Response:
 * {
 *   success: true,
 *   data: null,
 *   timestamp: string
 * }
 * 
 * Errors:
 * - 401: Missing or invalid token
 */
router.post('/logout', (req, res) => authController.logout(req, res));

/**
 * POST /api/auth/reset-password
 * Send password reset email
 * 
 * Request body:
 * {
 *   email: string
 * }
 * 
 * Response:
 * {
 *   success: true,
 *   data: {
 *     message: string
 *   },
 *   timestamp: string
 * }
 * 
 * Note: Always returns success to prevent email enumeration
 */
router.post('/reset-password', (req, res) => authController.resetPassword(req, res));

export default router;