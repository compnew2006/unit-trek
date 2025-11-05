import express from 'express';
import { query, queryOne } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import bcrypt from 'bcryptjs';
// Logger removed - using console
const router = express.Router();
router.use(authenticateToken);
// Get all users
router.get('/', async (_req, res, next) => {
    try {
        const profiles = await query('SELECT * FROM profiles ORDER BY created_at DESC');
        const users = await Promise.all(profiles.map(async (profile) => {
            const roleData = await queryOne('SELECT role FROM user_roles WHERE user_id = ? ORDER BY CASE role WHEN ? THEN 1 WHEN ? THEN 2 WHEN ? THEN 3 END LIMIT 1', [profile.user_id, 'admin', 'manager', 'user']);
            return {
                id: profile.user_id,
                username: profile.username,
                email: profile.email || undefined,
                role: roleData?.role || 'user',
                createdAt: profile.created_at,
                updatedAt: profile.updated_at,
            };
        }));
        res.json(users);
    }
    catch (error) {
        next(error);
    }
});
// Update user
router.put('/:id', async (req, res, next) => {
    try {
        const { username, email, role, password } = req.body;
        const userId = req.params.id;
        // Update profile
        if (username || email !== undefined) {
            const updateFields = [];
            const updateValues = [];
            if (username) {
                updateFields.push('username = ?');
                updateValues.push(username);
            }
            if (email !== undefined) {
                updateFields.push('email = ?');
                updateValues.push(email || null);
            }
            updateFields.push('updated_at = NOW()');
            updateValues.push(userId);
            await query(`UPDATE profiles SET ${updateFields.join(', ')} WHERE user_id = ?`, updateValues);
        }
        // Update password if provided
        if (password) {
            // Note: In a real implementation, you'd need to update the password in the auth system
            // This is a simplified version - you may need to call your auth service
            // For now, we'll just log it (password update requires auth system integration)
            await bcrypt.hash(password, 10); // Hash password for future use
            console.log('Password update requested for user', { userId });
        }
        // Update role
        if (role) {
            // Delete existing roles
            await query('DELETE FROM user_roles WHERE user_id = ?', [userId]);
            // Insert new role
            await query('INSERT INTO user_roles (user_id, role) VALUES (?, ?)', [userId, role]);
        }
        // Return updated user
        const profile = await queryOne('SELECT * FROM profiles WHERE user_id = ?', [userId]);
        if (!profile) {
            return res.status(404).json({ error: 'User not found' });
        }
        const roleData = await queryOne('SELECT role FROM user_roles WHERE user_id = ? ORDER BY CASE role WHEN ? THEN 1 WHEN ? THEN 2 WHEN ? THEN 3 END LIMIT 1', [userId, 'admin', 'manager', 'user']);
        return res.json({
            id: profile.user_id,
            username: profile.username,
            email: profile.email || undefined,
            role: roleData?.role || 'user',
            createdAt: profile.created_at,
            updatedAt: profile.updated_at,
        });
    }
    catch (error) {
        next(error);
    }
});
// Delete user
router.delete('/:id', async (req, res, next) => {
    try {
        const userId = req.params.id;
        // Check if user exists
        const profile = await queryOne('SELECT * FROM profiles WHERE user_id = ?', [userId]);
        if (!profile) {
            return res.status(404).json({ error: 'User not found' });
        }
        // Delete user roles
        await query('DELETE FROM user_roles WHERE user_id = ?', [userId]);
        // Delete profile
        await query('DELETE FROM profiles WHERE user_id = ?', [userId]);
        // Note: In a real implementation, you'd also need to delete from auth system
        // This is a simplified version
        return res.json({ message: 'User deleted successfully' });
    }
    catch (error) {
        next(error);
    }
});
export default router;
