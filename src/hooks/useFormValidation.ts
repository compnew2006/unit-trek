import { useState, useCallback } from 'react';

/**
 * Validation rule definition
 * @template T - Type of the value being validated
 */
type ValidationRule<T> = {
  /** Validation function that returns true if value is valid */
  validate: (value: T) => boolean;
  /** Error message to display if validation fails */
  message: string;
};

/**
 * Validation rules for form fields
 * @template T - Type of the form values object
 */
type ValidationRules<T> = {
  [K in keyof T]?: ValidationRule<T[K]>[];
};

/**
 * Custom hook for real-time form validation
 * 
 * Provides form state management with validation, error handling, and touch tracking.
 * Validates fields on change (if touched) and provides helper functions for form submission.
 * 
 * @template T - Type of the form values object
 * @param {T} initialValues - Initial form values
 * @param {ValidationRules<T>} rules - Validation rules for each field
 * @returns {Object} Form state and control functions
 * @property {T} values - Current form values
 * @property {Partial<Record<keyof T, string>>} errors - Current validation errors
 * @property {Partial<Record<keyof T, boolean>>} touched - Fields that have been touched/interacted with
 * @property {Function} setValue - Set value for a field (triggers validation if touched)
 * @property {Function} setTouchedField - Mark a field as touched (triggers validation)
 * @property {Function} validateAll - Validate all fields and return validation result
 * @property {Function} reset - Reset form to initial values
 * @property {boolean} isValid - Whether form is currently valid (no errors)
 * @example
 * ```tsx
 * const { values, errors, setValue, setTouchedField, validateAll, isValid } = useFormValidation(
 *   { email: '', password: '' },
 *   {
 *     email: [
 *       { validate: (v) => !!v, message: 'Email is required' },
 *       { validate: (v) => v.includes('@'), message: 'Invalid email' }
 *     ],
 *     password: [
 *       { validate: (v) => v.length >= 8, message: 'Password must be at least 8 characters' }
 *     ]
 *   }
 * );
 * ```
 */
export function useFormValidation<T extends Record<string, any>>(
  initialValues: T,
  rules: ValidationRules<T>
) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});

  const validateField = useCallback(
    (field: keyof T, value: any): string | null => {
      const fieldRules = rules[field];
      if (!fieldRules) return null;

      for (const rule of fieldRules) {
        if (!rule.validate(value)) {
          return rule.message;
        }
      }
      return null;
    },
    [rules]
  );

  const setValue = useCallback(
    (field: keyof T, value: any) => {
      setValues(prev => ({ ...prev, [field]: value }));

      // Validate immediately if field has been touched
      if (touched[field]) {
        const error = validateField(field, value);
        setErrors(prev => ({
          ...prev,
          [field]: error || undefined,
        }));
      }
    },
    [touched, validateField]
  );

  const setTouchedField = useCallback((field: keyof T) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    
    // Validate when field is touched
    const error = validateField(field, values[field]);
    setErrors(prev => ({
      ...prev,
      [field]: error || undefined,
    }));
  }, [validateField, values]);

  const validateAll = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof T, string>> = {};
    let isValid = true;

    for (const field in rules) {
      const error = validateField(field as keyof T, values[field]);
      if (error) {
        newErrors[field as keyof T] = error;
        isValid = false;
      }
    }

    setErrors(newErrors);
    setTouched(
      Object.keys(rules).reduce((acc, key) => ({ ...acc, [key]: true }), {})
    );

    return isValid;
  }, [rules, values, validateField]);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  return {
    values,
    errors,
    touched,
    setValue,
    setTouchedField,
    validateAll,
    reset,
    isValid: Object.keys(errors).length === 0,
  };
}

