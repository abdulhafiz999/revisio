import { CorsOptions } from 'cors';
import { env } from './environment';

/**
 * CORS configuration for the API
 * Allows requests only from the configured frontend origin
 */
export const corsOptions: CorsOptions = {
  // Allow requests from the frontend URL
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests) in development
    if (!origin && env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    // Parse FRONTEND_URL to handle multiple origins if needed
    const allowedOrigins = env.FRONTEND_URL.split(',').map(url => url.trim());
    
    if (origin && allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  
  // Allow credentials (cookies, authorization headers)
  credentials: true,
  
  // Allowed HTTP methods
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  
  // Allowed headers
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
  ],
  
  // Exposed headers that the client can access
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  
  // Cache preflight requests for 24 hours
  maxAge: 86400,
  
  // Pass the CORS preflight response to the next handler
  preflightContinue: false,
  
  // Provide a status code to use for successful OPTIONS requests
  optionsSuccessStatus: 204,
};

/**
 * Whitelist of allowed origins for additional validation
 */
export const allowedOrigins = env.FRONTEND_URL.split(',').map(url => url.trim());
