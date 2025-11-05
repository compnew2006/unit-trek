import express from 'express';
import { insert } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
// Logger removed - using console
const router = express.Router();
// Error logging endpoint (public for client-side errors)
router.post('/errors', async (req, res) => {
    try {
        const { level, message, stack, name, userId, url, userAgent, timestamp, ...context } = req.body;
        // Log to database if error_logs table exists
        try {
            await insert(`INSERT INTO error_logs (level, message, stack, name, user_id, url, user_agent, context, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
                level || 'error',
                message || 'Unknown error',
                stack || null,
                name || 'Error',
                userId || null,
                url || null,
                userAgent || null,
                JSON.stringify(context || {}),
                timestamp || new Date().toISOString(),
            ]);
        }
        catch (dbError) {
            // Table might not exist, log to logger
            const errorMessage = dbError instanceof Error ? dbError.message : 'Unknown error';
            console.error('Failed to log error to database', { error: errorMessage, details: req.body });
        }
        res.status(201).json({ success: true });
    }
    catch (error) {
        console.error('Error logging endpoint failed', { error: error instanceof Error ? error : new Error(String(error)) });
        res.status(500).json({ error: 'Failed to log error' });
    }
});
// Performance metrics endpoint
router.post('/performance', authenticateToken, async (req, res) => {
    try {
        const { metrics, timestamp } = req.body;
        // Log to database if performance_metrics table exists
        try {
            if (metrics && Array.isArray(metrics)) {
                for (const metric of metrics) {
                    await insert(`INSERT INTO performance_metrics (name, value, type, metadata, timestamp, created_at) 
             VALUES (?, ?, ?, ?, ?, ?)`, [
                        metric.name,
                        metric.value,
                        metric.type || 'custom',
                        JSON.stringify(metric.metadata || {}),
                        metric.timestamp,
                        timestamp || new Date().toISOString(),
                    ]);
                }
            }
        }
        catch (dbError) {
            // Table might not exist, log to logger
            const errorMessage = dbError instanceof Error ? dbError.message : 'Unknown error';
            console.warn('Performance metrics table not available', { error: errorMessage });
        }
        res.status(201).json({ success: true });
    }
    catch (error) {
        console.error('Performance metrics endpoint failed', { error: error instanceof Error ? error : new Error(String(error)) });
        res.status(500).json({ error: 'Failed to log performance metrics' });
    }
});
// User feedback endpoint
router.post('/feedback', async (req, res) => {
    try {
        const { type, message, email, url, userAgent, timestamp } = req.body;
        // Log to database if feedback table exists
        try {
            await insert(`INSERT INTO feedback (type, message, email, url, user_agent, created_at) 
         VALUES (?, ?, ?, ?, ?, ?)`, [
                type || 'other',
                message,
                email || null,
                url || null,
                userAgent || null,
                timestamp || new Date().toISOString(),
            ]);
        }
        catch (dbError) {
            // Table might not exist, log to logger
            const errorMessage = dbError instanceof Error ? dbError.message : 'Unknown error';
            console.log('Feedback received', { type, message, email });
            console.warn('Feedback table not available', { error: errorMessage });
        }
        res.status(201).json({ success: true, message: 'Thank you for your feedback!' });
    }
    catch (error) {
        console.error('Feedback endpoint failed', { error: error instanceof Error ? error : new Error(String(error)) });
        res.status(500).json({ error: 'Failed to submit feedback' });
    }
});
export default router;
