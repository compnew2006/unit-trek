import express from 'express';
import { randomUUID } from 'crypto';
import { transaction, getDbType } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
const router = express.Router();
router.use(authenticateToken);
// Record movement
router.post('/', async (req, res, next) => {
    try {
        const { itemId, type, quantity, notes } = req.body;
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        if (!itemId || !type || quantity === undefined) {
            return res.status(400).json({ error: 'itemId, type, and quantity are required' });
        }
        if (!['in', 'out', 'adjustment'].includes(type)) {
            return res.status(400).json({ error: 'Invalid movement type' });
        }
        await transaction(async (db) => {
            const dbType = getDbType();
            // Get item
            let item = null;
            if (dbType === 'postgresql') {
                const result = await db.query('SELECT * FROM items WHERE id = $1', [itemId]);
                item = result.rows[0];
            }
            else {
                const [rows] = await db.query('SELECT * FROM items WHERE id = ?', [itemId]);
                item = rows[0];
            }
            if (!item) {
                throw new Error('Item not found');
            }
            // Get warehouse
            let warehouse = null;
            if (dbType === 'postgresql') {
                const result = await db.query('SELECT * FROM warehouses WHERE id = $1', [item.warehouse_id]);
                warehouse = result.rows[0];
            }
            else {
                const [rows] = await db.query('SELECT * FROM warehouses WHERE id = ?', [item.warehouse_id]);
                warehouse = rows[0];
            }
            // Get user profile
            let profile = null;
            if (dbType === 'postgresql') {
                const result = await db.query('SELECT * FROM profiles WHERE user_id = $1', [userId]);
                profile = result.rows[0];
            }
            else {
                const [rows] = await db.query('SELECT * FROM profiles WHERE user_id = ?', [userId]);
                profile = rows[0];
            }
            const previousQuantity = item.quantity;
            let newQuantity = previousQuantity;
            if (type === 'in') {
                newQuantity += quantity;
            }
            else if (type === 'out') {
                newQuantity -= quantity;
                if (newQuantity < 0) {
                    throw new Error('Insufficient quantity');
                }
            }
            else if (type === 'adjustment') {
                newQuantity = quantity;
            }
            // Update item quantity (using db from transaction)
            if (dbType === 'postgresql') {
                await db.query('UPDATE items SET quantity = $1, updated_at = NOW() WHERE id = $2', [newQuantity, itemId]);
            }
            else {
                await db.query('UPDATE items SET quantity = ?, updated_at = NOW() WHERE id = ?', [newQuantity, itemId]);
            }
            // Create history entry
            const historyId = randomUUID();
            const historySql = dbType === 'postgresql'
                ? 'INSERT INTO history_entries (id, item_id, item_name, warehouse_id, warehouse_name, type, quantity, previous_quantity, new_quantity, user_id, username, notes, timestamp) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())'
                : 'INSERT INTO history_entries (id, item_id, item_name, warehouse_id, warehouse_name, type, quantity, previous_quantity, new_quantity, user_id, username, notes, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())';
            const historyParams = [
                historyId,
                itemId,
                item.name,
                item.warehouse_id,
                warehouse?.name || 'Unknown',
                type,
                Math.abs(type === 'adjustment' ? quantity - previousQuantity : quantity),
                previousQuantity,
                newQuantity,
                userId,
                profile?.username || 'Unknown',
                notes || null
            ];
            if (dbType === 'postgresql') {
                await db.query(historySql, historyParams);
            }
            else {
                await db.query(historySql, historyParams);
            }
            return undefined; // Explicit return for transaction callback
        });
        return res.status(201).json({ message: 'Movement recorded successfully' });
    }
    catch (error) {
        next(error);
    }
});
export default router;
