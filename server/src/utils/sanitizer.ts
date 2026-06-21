/**
 * Input sanitization utilities for SQL injection prevention
 * and general input cleaning
 */

/**
 * SQL injection patterns to detect and prevent
 */
const SQL_INJECTION_PATTERNS = [
  /\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|DECLARE)\b/i,
  /(--|;|\/\*|\*\/|xp_|sp_)/i,
];

/**
 * Check if a string contains potential SQL injection patterns
 */
export function containsSQLInjection(input: string): boolean {
  if (typeof input !== 'string') {
    return false;
  }
  
  return SQL_INJECTION_PATTERNS.some(pattern => pattern.test(input));
}

/**
 * Sanitize string input by removing potentially dangerous characters
 * Note: This is a defense-in-depth measure. Primary protection comes from
 * using parameterized queries with Supabase client.
 */
export function sanitizeString(input: string): string {
  if (input === null || input === undefined) {
    return '';
  }
  const str = String(input);
  
  // Trim whitespace
  let sanitized = str.trim();
  
  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');
  
  // Escape single quotes: replace ' with ''
  sanitized = sanitized.replace(/'/g, "''");
  
  return sanitized;
}

/**
 * Sanitize an object by sanitizing all string values
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  const sanitized: any = Array.isArray(obj) ? [] : {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => 
        typeof item === 'string' ? sanitizeString(item) : (typeof item === 'object' && item !== null ? sanitizeObject(item) : item)
      );
    } else if (value !== null && typeof value === 'object') {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized as T;
}

/**
 * Validate and sanitize email address
 */
export function sanitizeEmail(email: string): string {
  if (typeof email !== 'string') {
    return '';
  }
  
  // Convert to lowercase and trim
  return email.toLowerCase().trim();
}

/**
 * Check if email format is valid
 */
export function isValidEmail(email: string): boolean {
  if (typeof email !== 'string') {
    return false;
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Sanitize UUID format
 */
export function isValidUUID(uuid: string): boolean {
  if (typeof uuid !== 'string') {
    return false;
  }
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validate that input is safe from SQL injection
 */
export function validateSafeInput(input: string, fieldName?: string): void {
  if (typeof input === 'string' && containsSQLInjection(input)) {
    throw new Error(`Potential SQL injection detected${fieldName ? ` in field: ${fieldName}` : ''}`);
  }
}

/**
 * Sanitize and validate input
 */
export function sanitizeAndValidate(input: string): string {
  validateSafeInput(input);
  return sanitizeString(input);
}

/**
 * Escape HTML special characters to prevent XSS
 */
export function sanitizeHTML(text: string): string {
  if (typeof text !== 'string') {
    return '';
  }
  
  const htmlEscapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  
  return text.replace(/[&<>"'/]/g, char => htmlEscapeMap[char]);
}

// Export escapeHtml for backward compatibility
export const escapeHtml = sanitizeHTML;

/**
 * Sanitize filename for safe storage
 */
export function sanitizeFilename(filename: string): string {
  if (typeof filename !== 'string' || filename.trim() === '') {
    return 'file';
  }
  
  let clean = filename;
  
  if (clean.includes('..')) {
    // Directory traversal: remove all dots, slashes, and backslashes
    clean = clean.replace(/[.\\/]/g, '');
  } else {
    // Normal filename: replace path separators / and \ with underscore
    clean = clean.replace(/[\\/]/g, '_');
    // Replace other unsafe characters with underscore
    clean = clean.replace(/[^a-zA-Z0-9._-]/g, '_');
  }
  
  if (clean.trim() === '') {
    return 'file';
  }
  
  // Limit length
  if (clean.length > 255) {
    const ext = clean.split('.').pop() || '';
    const name = clean.substring(0, 255 - ext.length - 1);
    clean = `${name}.${ext}`;
  }
  
  return clean;
}

/**
 * Validate and sanitize integer input
 */
export function sanitizeInteger(value: any, defaultValue: number = 0): number {
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Validate and sanitize positive integer input
 */
export function sanitizePositiveInteger(value: any, defaultValue: number = 1): number {
  const parsed = sanitizeInteger(value, defaultValue);
  return parsed > 0 ? parsed : defaultValue;
}
