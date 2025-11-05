import express from 'express';
import { query } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
const router = express.Router();
router.use(authenticateToken);
function mapHistoryEntry(db) {
    return {
        id: db.id,
        itemId: db.item_id,
        itemName: db.item_name,
        warehouseId: db.warehouse_id,
        warehouseName: db.warehouse_name,
        type: db.type,
        quantity: db.quantity,
        previousQuantity: db.previous_quantity,
        newQuantity: db.new_quantity,
        userId: db.user_id,
        username: db.username,
        timestamp: db.timestamp,
        notes: db.notes || undefined,
    };
}
// Get all history
router.get('/', async (_req, res, next) => {
    try {
        const history = await query('SELECT * FROM history_entries ORDER BY timestamp DESC');
        res.json(history.map(mapHistoryEntry));
    }
    catch (error) {
        next(error);
    }
});
// Get history by warehouse
router.get('/warehouse/:warehouseId', async (req, res, next) => {
    try {
        const history = await query('SELECT * FROM history_entries WHERE warehouse_id = ? ORDER BY timestamp DESC', [req.params.warehouseId]);
        res.json(history.map(mapHistoryEntry));
    }
    catch (error) {
        next(error);
    }
});
// Get history by item
router.get('/item/:itemId', async (req, res, next) => {
    try {
        const history = await query('SELECT * FROM history_entries WHERE item_id = ? ORDER BY timestamp DESC', [req.params.itemId]);
        res.json(history.map(mapHistoryEntry));
    }
    catch (error) {
        next(error);
    }
});
export default router;
