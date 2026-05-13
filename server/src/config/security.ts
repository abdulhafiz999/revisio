import helmet from 'helmet';
import { env } from './environment';

/**
 * Security headers configuration using Helmet
 * Provides protection against common web vulnerabilities
 */
export const helmetConfig = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  
  // X-Content-Type-Options: nosniff
  // Prevents browsers from MIME-sniffing a response away from the declared content-type
  noSniff: true,
  
  // X-Frame-Options: DENY
  // Prevents clickjacking attacks by not allowing the page to be embedded in frames
  frameguard: {
    action: 'deny',
  },
  
  // X-XSS-Protection: 1; mode=block
  // Enables XSS filter built into most browsers
  xssFilter: true,
  
  // Strict-Transport-Security (HSTS)
  // Forces HTTPS connections in production
  hsts: env.NODE_ENV === 'production' ? {
    maxAge: 31536000, // 1 year in seconds
    includeSubDomains: true,
    preload: true,
  } : false,
  
  // Hide X-Powered-By header
  hidePoweredBy: true,
  
  // Referrer-Policy
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin',
  },
});
