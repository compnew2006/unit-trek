import express from 'express';
import { randomUUID } from 'crypto';
import { query, queryOne, insert } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { writeLimiter } from '../middleware/rateLimiter.js';
import { validate, createItemSchema, updateItemSchema, itemIdSchema, bulkCreateItemsSchema } from '../validations/schemas.js';
const router = express.Router();
router.use(authenticateToken);
// Apply rate limiting to write operations
router.use(writeLimiter);
function mapItem(db) {
    return {
        id: db.id,
        name: db.name,
        barcode: db.barcode || undefined,
        warehouseId: db.warehouse_id,
        quantity: db.quantity,
        minQuantity: db.min_quantity || undefined,
        description: db.description || undefined,
        createdAt: db.created_at,
        updatedAt: db.updated_at,
        createdBy: db.created_by,
    };
}
// Get all items
router.get('/', async (_req, res, next) => {
    try {
        const items = await query('SELECT * FROM items ORDER BY created_at DESC');
        res.json(items.map(mapItem));
    }
    catch (error) {
        next(error);
    }
});
// Get items by warehouse
router.get('/warehouse/:warehouseId', async (req, res, next) => {
    try {
        const items = await query('SELECT * FROM items WHERE warehouse_id = ? ORDER BY created_at DESC', [req.params.warehouseId]);
        res.json(items.map(mapItem));
    }
    catch (error) {
        next(error);
    }
});
// Get item by ID
router.get('/:id', validate(itemIdSchema), async (req, res, next) => {
    try {
        const item = await queryOne('SELECT * FROM items WHERE id = ?', [req.params.id]);
        if (!item) {
            return res.status(404).json({ error: 'Item not found' });
        }
        res.json(mapItem(item));
    }
    catch (error) {
        next(error);
    }
});
// Create item
router.post('/', validate(createItemSchema), async (req, res, next) => {
    try {
        const { name, barcode, warehouseId, quantity, minQuantity, description } = req.body;
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const id = randomUUID();
        await insert('INSERT INTO items (id, name, barcode, warehouse_id, quantity, min_quantity, description, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())', [id, name, barcode || null, warehouseId, quantity || 0, minQuantity || null, description || null, userId]);
        const item = await queryOne('SELECT * FROM items WHERE id = ?', [id]);
        if (!item) {
            return res.status(500).json({ error: 'Failed to create item' });
        }
        res.status(201).json(mapItem(item));
    }
    catch (error) {
        next(error);
    }
});
// Update item
router.put('/:id', validate(updateItemSchema), async (req, res, next) => {
    try {
        const { name, barcode, quantity, minQuantity, description } = req.body;
        await query('UPDATE items SET name = COALESCE(?, name), barcode = ?, quantity = COALESCE(?, quantity), min_quantity = ?, description = ?, updated_at = NOW() WHERE id = ?', [name, barcode || null, quantity, minQuantity || null, description || null, req.params.id]);
        const item = await queryOne('SELECT * FROM items WHERE id = ?', [req.params.id]);
        if (!item) {
            return res.status(404).json({ error: 'Item not found' });
        }
        res.json(mapItem(item));
    }
    catch (error) {
        next(error);
    }
});
// Delete item
router.delete('/:id', validate(itemIdSchema), async (req, res, next) => {
    try {
        await query('DELETE FROM items WHERE id = ?', [req.params.id]);
        res.status(204).send();
    }
    catch (error) {
        next(error);
    }
});
// Bulk create items
router.post('/bulk', validate(bulkCreateItemsSchema), async (req, res, next) => {
    try {
        const { items } = req.body;
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const createdItems = [];
        for (const itemData of items) {
            const { name, barcode, warehouseId, quantity, minQuantity, description } = itemData;
            const id = randomUUID();
            await insert('INSERT INTO items (id, name, barcode, warehouse_id, quantity, min_quantity, description, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())', [id, name, barcode || null, warehouseId, quantity || 0, minQuantity || null, description || null, userId]);
            const item = await queryOne('SELECT * FROM items WHERE id = ?', [id]);
            if (item) {
                createdItems.push(mapItem(item));
            }
        }
        res.status(201).json(createdItems);
    }
    catch (error) {
        next(error);
    }
});
export default router;
