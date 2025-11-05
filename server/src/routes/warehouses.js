import express from 'express';
import { randomUUID } from 'crypto';
import { query, queryOne, insert } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
const router = express.Router();
router.use(authenticateToken);
function mapWarehouse(db) {
    return {
        id: db.id,
        name: db.name,
        location: db.location || undefined,
        description: db.description || undefined,
        createdAt: db.created_at,
        updatedAt: db.updated_at,
        createdBy: db.created_by,
    };
}
// Get all warehouses
router.get('/', async (_req, res, next) => {
    try {
        const warehouses = await query('SELECT * FROM warehouses ORDER BY created_at DESC');
        return res.json(warehouses.map(mapWarehouse));
    }
    catch (error) {
        next(error);
    }
});
// Get warehouse by ID
router.get('/:id', async (req, res, next) => {
    try {
        const warehouse = await queryOne('SELECT * FROM warehouses WHERE id = ?', [req.params.id]);
        if (!warehouse) {
            return res.status(404).json({ error: 'Warehouse not found' });
        }
        return res.json(mapWarehouse(warehouse));
    }
    catch (error) {
        next(error);
    }
});
// Create warehouse
router.post('/', async (req, res, next) => {
    try {
        const { name, location, description } = req.body;
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        if (!name) {
            return res.status(400).json({ error: 'Name is required' });
        }
        const id = randomUUID();
        await insert('INSERT INTO warehouses (id, name, location, description, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())', [id, name, location || null, description || null, userId]);
        const warehouse = await queryOne('SELECT * FROM warehouses WHERE id = ?', [id]);
        if (!warehouse) {
            return res.status(500).json({ error: 'Failed to create warehouse' });
        }
        return res.status(201).json(mapWarehouse(warehouse));
    }
    catch (error) {
        next(error);
    }
});
// Update warehouse
router.put('/:id', async (req, res, next) => {
    try {
        const { name, location, description } = req.body;
        await query('UPDATE warehouses SET name = COALESCE(?, name), location = ?, description = ?, updated_at = NOW() WHERE id = ?', [name, location || null, description || null, req.params.id]);
        const warehouse = await queryOne('SELECT * FROM warehouses WHERE id = ?', [req.params.id]);
        if (!warehouse) {
            return res.status(404).json({ error: 'Warehouse not found' });
        }
        return res.json(mapWarehouse(warehouse));
    }
    catch (error) {
        next(error);
    }
});
// Delete warehouse
router.delete('/:id', async (req, res, next) => {
    try {
        await query('DELETE FROM warehouses WHERE id = ?', [req.params.id]);
        return res.status(204).send();
    }
    catch (error) {
        next(error);
    }
});
export default router;
