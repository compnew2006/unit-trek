import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  sanitizeHtml,
  sanitizeString,
  sanitizeBarcode,
  sanitizeNumber,
  sanitizeEmail,
  sanitizeUrl,
  validateFile,
  escapeHtml,
  sanitizeObject,
} from '../sanitize';

describe('Sanitize Utilities', () => {
  describe('sanitizeHtml', () => {
    it('should remove HTML tags', () => {
      expect(sanitizeHtml('<script>alert("xss")</script>')).toBe('alert("xss")');
      expect(sanitizeHtml('<div>Hello</div>')).toBe('Hello');
    });

    it('should handle empty strings', () => {
      expect(sanitizeHtml('')).toBe('');
      expect(sanitizeHtml(null as any)).toBe('');
    });
  });

  describe('sanitizeString', () => {
    it('should remove dangerous characters', () => {
      expect(sanitizeString('test<script>')).toBe('testscript');
      expect(sanitizeString('test"quotes"')).toBe('testquotes');
    });

    it('should normalize whitespace', () => {
      expect(sanitizeString('test    multiple   spaces')).toBe('test multiple spaces');
    });

    it('should trim strings', () => {
      expect(sanitizeString('  test  ')).toBe('test');
    });
  });

  describe('sanitizeBarcode', () => {
    it('should only allow alphanumeric, dash, and underscore', () => {
      expect(sanitizeBarcode('ABC123-456_789')).toBe('ABC123-456_789');
      expect(sanitizeBarcode('ABC123<script>')).toBe('ABC123');
      expect(sanitizeBarcode('test@test')).toBe('TESTTEST');
    });

    it('should convert to uppercase', () => {
      expect(sanitizeBarcode('abc123')).toBe('ABC123');
    });
  });

  describe('sanitizeNumber', () => {
    it('should parse valid numbers', () => {
      expect(sanitizeNumber('123')).toBe(123);
      expect(sanitizeNumber('123.45')).toBe(123.45);
      expect(sanitizeNumber(123)).toBe(123);
    });

    it('should return 0 for invalid numbers', () => {
      expect(sanitizeNumber('invalid')).toBe(0);
      expect(sanitizeNumber('')).toBe(0);
    });
  });

  describe('sanitizeEmail', () => {
    it('should clean email strings', () => {
      expect(sanitizeEmail('test@example.com')).toBe('test@example.com');
      expect(sanitizeEmail('TEST@EXAMPLE.COM')).toBe('test@example.com');
      expect(sanitizeEmail('test<script>@example.com')).toBe('testscriptexample.com');
    });
  });

  describe('sanitizeUrl', () => {
    it('should block dangerous protocols', () => {
      expect(sanitizeUrl('javascript:alert("xss")')).toBe('');
      expect(sanitizeUrl('data:text/html,<script>alert("xss")</script>')).toBe('');
    });

    it('should allow safe URLs', () => {
      expect(sanitizeUrl('https://example.com')).toBe('https://example.com');
      expect(sanitizeUrl('http://example.com')).toBe('http://example.com');
    });
  });

  describe('validateFile', () => {
    it('should validate file size', () => {
      const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'test.xlsx');
      const result = validateFile(largeFile, { maxSize: 5 * 1024 * 1024 });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('File size exceeds');
    });

    it('should validate file type', () => {
      const file = new File(['content'], 'test.txt');
      const result = validateFile(file, { allowedTypes: ['.xlsx', '.csv'] });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('File type not allowed');
    });

    it('should accept valid files', () => {
      const file = new File(['content'], 'test.xlsx');
      const result = validateFile(file, { allowedTypes: ['.xlsx'] });
      expect(result.valid).toBe(true);
    });
  });

  describe('escapeHtml', () => {
    it('should escape HTML entities', () => {
      expect(escapeHtml('<div>test</div>')).toBe('&lt;div&gt;test&lt;/div&gt;');
      expect(escapeHtml('"quotes"')).toBe('&quot;quotes&quot;');
      expect(escapeHtml("'apostrophe'")).toBe('&#039;apostrophe&#039;');
    });
  });

  describe('sanitizeObject', () => {
    it('should sanitize object properties recursively', () => {
      const obj = {
        name: '<script>test</script>',
        value: 123,
        nested: {
          text: '  test  ',
        },
      };
      const sanitized = sanitizeObject(obj);
      expect(sanitized.name).toBe('testscript');
      expect(sanitized.value).toBe(123);
      expect(sanitized.nested.text).toBe('test');
    });
  });
});

