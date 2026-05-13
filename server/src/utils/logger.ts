import { env } from '../config/environment';

/**
 * Log levels in order of severity
 */
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

/**
 * Color codes for terminal output
 */
const colors = {
  DEBUG: '\x1b[36m', // Cyan
  INFO: '\x1b[32m',  // Green
  WARN: '\x1b[33m',  // Yellow
  ERROR: '\x1b[31m', // Red
  RESET: '\x1b[0m',
};

/**
 * Logger utility with different log levels
 * Configures detailed logging in development, error-only in production
 */
class Logger {
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = env.NODE_ENV === 'development';
  }

  /**
   * Format log message with timestamp and level
   */
  private formatMessage(level: LogLevel, message: string, meta?: any): string {
    const timestamp = new Date().toISOString();
    const color = colors[level];
    const reset = colors.RESET;
    
    let formatted = `${color}[${timestamp}] [${level}]${reset} ${message}`;
    
    if (meta !== undefined) {
      formatted += `\n${JSON.stringify(meta, null, 2)}`;
    }
    
    return formatted;
  }

  /**
   * Log debug messages (development only)
   */
  debug(message: string, meta?: any): void {
    if (this.isDevelopment) {
      console.log(this.formatMessage(LogLevel.DEBUG, message, meta));
    }
  }

  /**
   * Log informational messages (development only)
   */
  info(message: string, meta?: any): void {
    if (this.isDevelopment) {
      console.log(this.formatMessage(LogLevel.INFO, message, meta));
    }
  }

  /**
   * Log warning messages (all environments)
   */
  warn(message: string, meta?: any): void {
    console.warn(this.formatMessage(LogLevel.WARN, message, meta));
  }

  /**
   * Log error messages (all environments)
   */
  error(message: string, error?: Error | any): void {
    const meta = error instanceof Error
      ? {
          message: error.message,
          stack: this.isDevelopment ? error.stack : undefined,
          ...error,
        }
      : error;
    
    console.error(this.formatMessage(LogLevel.ERROR, message, meta));
  }

  /**
   * Log HTTP request (development only)
   */
  http(method: string, path: string, statusCode: number, duration: number): void {
    if (this.isDevelopment) {
      const message = `${method} ${path} ${statusCode} - ${duration}ms`;
      this.info(message);
    }
  }
}

// Export singleton instance
export const logger = new Logger();
