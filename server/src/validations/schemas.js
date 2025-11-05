import { z } from 'zod';

/**
 * Authentication schemas
 */
export const registerSchema = z.object({
  email: z.string().email('Invalid email format').min(5).max(255),
  username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(100),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const logoutSchema = z.object({
  refreshToken: z.string().optional(),
});

export const logoutAllSchema = z.object({
  userId: z.string().uuid('Invalid user ID format'),
});

/**
 * User schemas
 */
export const updateUserSchema = z.object({
  username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores').optional(),
  email: z.string().email('Invalid email format').optional(),
  role: z.enum(['admin', 'manager', 'user']).optional(),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
});

/**
 * Warehouse schemas
 */
export const createWarehouseSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  location: z.string().max(500).optional(),
  description: z.string().max(1000).optional(),
});

export const updateWarehouseSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255).optional(),
  location: z.string().max(500).optional(),
  description: z.string().max(1000).optional(),
});

export const warehouseIdSchema = z.object({
  id: z.string().uuid('Invalid warehouse ID format'),
});

/**
 * Item schemas
 */
export const createItemSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  barcode: z.string().max(100).regex(/^[a-zA-Z0-9\-_]*$/, 'Barcode can only contain letters, numbers, dashes, and underscores').optional().nullable(),
  warehouseId: z.string().uuid('Invalid warehouse ID format'),
  quantity: z.number().int().min(0, 'Quantity cannot be negative').default(0),
  minQuantity: z.number().int().min(0, 'Min quantity cannot be negative').optional().nullable(),
  description: z.string().max(1000).optional().nullable(),
});

export const updateItemSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255).optional(),
  barcode: z.string().max(100).regex(/^[a-zA-Z0-9\-_]*$/, 'Barcode can only contain letters, numbers, dashes, and underscores').optional().nullable(),
  quantity: z.number().int().min(0, 'Quantity cannot be negative').optional(),
  minQuantity: z.number().int().min(0, 'Min quantity cannot be negative').optional().nullable(),
  description: z.string().max(1000).optional().nullable(),
});

export const itemIdSchema = z.object({
  id: z.string().uuid('Invalid item ID format'),
});

export const bulkCreateItemsSchema = z.object({
  items: z.array(createItemSchema).min(1, 'At least one item is required').max(100, 'Cannot create more than 100 items at once'),
});

/**
 * Movement schemas
 */
export const createMovementSchema = z.object({
  itemId: z.string().uuid('Invalid item ID format'),
  type: z.enum(['in', 'out', 'transfer'], {
    errorMap: () => ({ message: 'Type must be "in", "out", or "transfer"' })
  }),
  quantity: z.number().int().positive('Quantity must be positive'),
  notes: z.string().max(500).optional().nullable(),
  toWarehouseId: z.string().uuid('Invalid warehouse ID format').optional(),
});

export const movementIdSchema = z.object({
  id: z.string().uuid('Invalid movement ID format'),
});

/**
 * History schemas
 */
export const historyQuerySchema = z.object({
  itemId: z.string().uuid('Invalid item ID format').optional(),
  warehouseId: z.string().uuid('Invalid warehouse ID format').optional(),
  type: z.enum(['in', 'out', 'transfer']).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  limit: z.number().int().positive().max(1000).default(100),
  offset: z.number().int().min(0).default(0),
});

/**
 * Validation middleware
 */
export const validate = (schema) => {
  return (req, res, next) => {
    try {
      // Validate body, params, and query
      const validationData = {
        ...req.body,
        ...req.params,
        ...req.query,
      };
      
      const validated = schema.parse(validationData);
      
      // Update request with validated data
      req.body = { ...req.body, ...validated };
      req.params = { ...req.params, ...validated };
      req.query = { ...req.query, ...validated };
      
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        
        return res.status(400).json({
          error: 'Validation failed',
          details: errors,
        });
      }
      
      next(error);
    }
  };
};

