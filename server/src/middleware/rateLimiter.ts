import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

/**
 * Rate limiting middleware configuration
 * Limits requests to 100 per minute per user/IP
 * Returns 429 error when limit is exceeded
 */
export const rateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: 100, // Maximum 100 requests per window
  
  // Use user ID if authenticated, otherwise use IP address
  keyGenerator: (req: Request): string => {
    // Check if user is authenticated (set by auth middleware)
    const authenticatedReq = req as any;
    if (authenticatedReq.user?.id) {
      return `user:${authenticatedReq.user.id}`;
    }
    // Fallback to IP address for unauthenticated requests
    return req.ip || 'unknown';
  },
  
  // Standardized error response format
  handler: (req: Request, res: Response): void => {
    res.status(429).json({
      success: false,
      error: 'Too many requests. Please try again later.',
      timestamp: new Date().toISOString(),
    });
  },
  
  // Skip successful requests from counting (optional - can be removed if all requests should count)
  skipSuccessfulRequests: false,
  
  // Skip failed requests from counting (optional - can be removed if all requests should count)
  skipFailedRequests: false,
  
  // Standard headers for rate limit info
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
});

/**
 * Stricter rate limiter for authentication endpoints
 * Limits to 10 requests per minute to prevent brute force attacks
 */
export const authRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: 10, // Maximum 10 requests per window
  
  keyGenerator: (req: Request): string => {
    return req.ip || 'unknown';
  },
  
  handler: (req: Request, res: Response): void => {
    res.status(429).json({
      success: false,
      error: 'Too many authentication attempts. Please try again later.',
      timestamp: new Date().toISOString(),
    });
  },
  
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Stricter rate limiter for AI endpoints
 * Limits to 20 requests per minute due to higher computational cost
 */
export const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: 20, // Maximum 20 requests per window
  
  keyGenerator: (req: Request): string => {
    const authenticatedReq = req as any;
    if (authenticatedReq.user?.id) {
      return `ai:user:${authenticatedReq.user.id}`;
    }
    return `ai:${req.ip || 'unknown'}`;
  },
  
  handler: (req: Request, res: Response): void => {
    res.status(429).json({
      success: false,
      error: 'Too many AI requests. Please try again later.',
      timestamp: new Date().toISOString(),
    });
  },
  
  standardHeaders: true,
  legacyHeaders: false,
});
