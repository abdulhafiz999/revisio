import { describe, it, expect } from 'vitest';
import {
  containsSQLInjection,
  sanitizeString,
  sanitizeObject,
  validateSafeInput,
  sanitizeAndValidate,
  sanitizeHTML,
  isValidEmail,
  isValidUUID,
  sanitizeFilename,
} from './sanitizer';

describe('Sanitizer Utilities', () => {
  describe('containsSQLInjection', () => {
    it('should detect SQL keywords', () => {
      expect(containsSQLInjection('SELECT * FROM users')).toBe(true);
      expect(containsSQLInjection('DROP TABLE users')).toBe(true);
      expect(containsSQLInjection('INSERT INTO users')).toBe(true);
      expect(containsSQLInjection('DELETE FROM users')).toBe(true);
      expect(containsSQLInjection('UPDATE users SET')).toBe(true);
    });

    it('should detect SQL comment patterns', () => {
      expect(containsSQLInjection('test -- comment')).toBe(true);
      expect(containsSQLInjection('test /* comment */')).toBe(true);
    });

    it('should not flag safe strings', () => {
      expect(containsSQLInjection('Hello World')).toBe(false);
      expect(containsSQLInjection('user@example.com')).toBe(false);
      expect(containsSQLInjection('This is a normal sentence.')).toBe(false);
    });

    it('should handle non-string inputs', () => {
      expect(containsSQLInjection(123 as any)).toBe(false);
      expect(containsSQLInjection(null as any)).toBe(false);
    });
  });

  describe('sanitizeString', () => {
    it('should escape single quotes', () => {
      expect(sanitizeString("O'Brien")).toBe("O''Brien");
      expect(sanitizeString("It's a test")).toBe("It''s a test");
    });

    it('should remove null bytes', () => {
      expect(sanitizeString('test\0string')).toBe('teststring');
    });

    it('should handle non-string inputs', () => {
      expect(sanitizeString(123 as any)).toBe('123');
    });

    it('should handle empty strings', () => {
      expect(sanitizeString('')).toBe('');
    });
  });

  describe('sanitizeObject', () => {
    it('should sanitize string values in object', () => {
      const input = {
        name: "O'Brien",
        email: 'test@example.com',
      };

      const result = sanitizeObject(input);

      expect(result.name).toBe("O''Brien");
      expect(result.email).toBe('test@example.com');
    });

    it('should sanitize nested objects', () => {
      const input = {
        user: {
          name: "O'Brien",
        },
      };

      const result = sanitizeObject(input);

      expect(result.user.name).toBe("O''Brien");
    });

    it('should sanitize arrays', () => {
      const input = {
        names: ["O'Brien", "Smith"],
      };

      const result = sanitizeObject(input);

      expect(result.names[0]).toBe("O''Brien");
      expect(result.names[1]).toBe('Smith');
    });

    it('should preserve non-string values', () => {
      const input = {
        name: 'test',
        age: 25,
        active: true,
        data: null,
      };

      const result = sanitizeObject(input);

      expect(result.age).toBe(25);
      expect(result.active).toBe(true);
      expect(result.data).toBe(null);
    });
  });

  describe('validateSafeInput', () => {
    it('should throw error for SQL injection patterns', () => {
      expect(() => validateSafeInput('SELECT * FROM users')).toThrow();
      expect(() => validateSafeInput('DROP TABLE users')).toThrow();
    });

    it('should not throw for safe inputs', () => {
      expect(() => validateSafeInput('Hello World')).not.toThrow();
      expect(() => validateSafeInput('user@example.com')).not.toThrow();
    });

    it('should include field name in error message', () => {
      expect(() => validateSafeInput('SELECT *', 'username')).toThrow('username');
    });
  });

  describe('sanitizeAndValidate', () => {
    it('should sanitize and return safe input', () => {
      const result = sanitizeAndValidate("O'Brien");
      expect(result).toBe("O''Brien");
    });

    it('should throw for dangerous input', () => {
      expect(() => sanitizeAndValidate('SELECT * FROM users')).toThrow();
    });
  });

  describe('sanitizeHTML', () => {
    it('should escape HTML special characters', () => {
      expect(sanitizeHTML('<script>alert("xss")</script>')).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;'
      );
    });

    it('should escape ampersands', () => {
      expect(sanitizeHTML('Tom & Jerry')).toBe('Tom &amp; Jerry');
    });

    it('should handle normal text', () => {
      expect(sanitizeHTML('Hello World')).toBe('Hello World');
    });
  });

  describe('isValidEmail', () => {
    it('should validate correct email formats', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
      expect(isValidEmail('user+tag@example.com')).toBe(true);
    });

    it('should reject invalid email formats', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('invalid@')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
    });
  });

  describe('isValidUUID', () => {
    it('should validate correct UUID formats', () => {
      expect(isValidUUID('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
      expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    });

    it('should reject invalid UUID formats', () => {
      expect(isValidUUID('invalid-uuid')).toBe(false);
      expect(isValidUUID('123456')).toBe(false);
      expect(isValidUUID('123e4567-e89b-12d3-a456')).toBe(false);
    });
  });

  describe('sanitizeFilename', () => {
    it('should remove directory traversal patterns', () => {
      expect(sanitizeFilename('../../../etc/passwd')).toBe('etcpasswd');
      expect(sanitizeFilename('..\\..\\windows\\system32')).toBe('windowssystem32');
    });

    it('should remove path separators', () => {
      expect(sanitizeFilename('path/to/file.txt')).toBe('path_to_file.txt');
      expect(sanitizeFilename('path\\to\\file.txt')).toBe('path_to_file.txt');
    });

    it('should keep safe characters', () => {
      expect(sanitizeFilename('my-file_name.txt')).toBe('my-file_name.txt');
      expect(sanitizeFilename('document-2024.pdf')).toBe('document-2024.pdf');
    });

    it('should replace unsafe characters with underscores', () => {
      expect(sanitizeFilename('file name with spaces.txt')).toBe('file_name_with_spaces.txt');
      expect(sanitizeFilename('file@#$%name.txt')).toBe('file____name.txt');
    });

    it('should return default for empty or invalid input', () => {
      expect(sanitizeFilename('')).toBe('file');
      expect(sanitizeFilename('...')).toBe('file');
      expect(sanitizeFilename(null as any)).toBe('file');
    });
  });
});
