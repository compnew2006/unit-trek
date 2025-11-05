/**
 * Security utilities for input sanitization
 * Prevents XSS attacks and ensures safe data handling
 * 
 * @module sanitize
 * @description Provides functions to sanitize user inputs and prevent security vulnerabilities
 */

/**
 * Sanitize HTML content to prevent XSS attacks
 * Removes potentially dangerous HTML tags and attributes by converting to text content
 * 
 * @param {string} input - The HTML string to sanitize
 * @returns {string} The sanitized text content (HTML tags removed)
 * @example
 * ```ts
 * sanitizeHtml('<script>alert("xss")</script>'); // Returns: 'alert("xss")'
 * sanitizeHtml('<div>Hello</div>'); // Returns: 'Hello'
 * ```
 */
export function sanitizeHtml(input: string): string {
  if (!input) return '';
  
  // Create a temporary div to parse HTML
  const temp = document.createElement('div');
  temp.textContent = input;
  return temp.innerHTML;
}

/**
 * Sanitize string input by removing special characters
 * Useful for IDs, filenames, and other text inputs that shouldn't contain HTML
 * 
 * @param {string} input - The string to sanitize
 * @returns {string} The sanitized string with dangerous characters removed and whitespace normalized
 * @example
 * ```ts
 * sanitizeString('test<script>'); // Returns: 'testscript'
 * sanitizeString('  test    multiple   spaces  '); // Returns: 'test multiple spaces'
 * ```
 */
export function sanitizeString(input: string): string {
  if (!input) return '';
  
  return input
    .trim()
    .replace(/[<>'"]/g, '') // Remove potentially dangerous characters
    .replace(/\s+/g, ' '); // Normalize whitespace
}

/**
 * Sanitize barcode input
 * Only allows alphanumeric characters, dashes, and underscores
 * Converts to uppercase for consistency
 * 
 * @param {string} input - The barcode string to sanitize
 * @returns {string} The sanitized barcode in uppercase
 * @example
 * ```ts
 * sanitizeBarcode('abc123-456_789'); // Returns: 'ABC123-456_789'
 * sanitizeBarcode('abc@123'); // Returns: 'ABC123'
 * ```
 */
export function sanitizeBarcode(input: string): string {
  if (!input) return '';
  
  return input
    .trim()
    .replace(/[^a-zA-Z0-9\-_]/g, '') // Only allow alphanumeric, dash, underscore
    .toUpperCase();
}

/**
 * Sanitize numeric input
 * Ensures only valid numbers
 */
export function sanitizeNumber(input: string | number): number {
  const num = typeof input === 'string' ? parseFloat(input) : input;
  return isNaN(num) ? 0 : num;
}

/**
 * Validate and sanitize email
 */
export function sanitizeEmail(email: string): string {
  if (!email) return '';
  
  return email
    .trim()
    .toLowerCase()
    .replace(/[^\w\s@.\-+]/g, ''); // Allow only valid email characters
}

/**
 * Sanitize URL to prevent javascript: and data: protocols
 */
export function sanitizeUrl(url: string): string {
  if (!url) return '';
  
  const trimmed = url.trim().toLowerCase();
  
  // Block dangerous protocols
  if (
    trimmed.startsWith('javascript:') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('vbscript:')
  ) {
    return '';
  }
  
  return url.trim();
}

/**
 * Validate file upload
 * Checks file type and size to prevent malicious uploads
 * 
 * @param {File} file - The file to validate
 * @param {Object} options - Validation options
 * @param {number} [options.maxSize=5242880] - Maximum file size in bytes (default: 5MB)
 * @param {string[]} [options.allowedTypes=['.xlsx', '.xls', '.csv']] - Allowed file extensions
 * @returns {{valid: boolean, error?: string}} Validation result with error message if invalid
 * @example
 * ```ts
 * const result = validateFile(file, {
 *   maxSize: 10 * 1024 * 1024, // 10MB
 *   allowedTypes: ['.xlsx', '.csv']
 * });
 * if (!result.valid) {
 *   console.error(result.error);
 * }
 * ```
 */
export function validateFile(
  file: File,
  options: {
    maxSize?: number; // in bytes
    allowedTypes?: string[];
  } = {}
): { valid: boolean; error?: string } {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB default
    allowedTypes = ['.xlsx', '.xls', '.csv'],
  } = options;

  // Check file size
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds ${Math.round(maxSize / 1024 / 1024)}MB`,
    };
  }

  // Check file type
  const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
  if (!allowedTypes.includes(fileExt)) {
    return {
      valid: false,
      error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`,
    };
  }

  return { valid: true };
}

/**
 * Escape HTML entities to prevent XSS
 */
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  
  return text.replace(/[&<>"']/g, (char) => map[char]);
}

/**
 * Sanitize object properties recursively
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const sanitized = {} as T;
  
  for (const key in obj) {
    const value = obj[key];
    
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value) as T[Extract<keyof T, string>];
    } else if (typeof value === 'number') {
      sanitized[key] = sanitizeNumber(value) as T[Extract<keyof T, string>];
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

