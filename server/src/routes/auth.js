import express from 'express';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { queryOne, insert } from '../config/database.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken, revokeRefreshToken, revokeAllUserTokens } from '../utils/tokenHelpers.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { validate, registerSchema, loginSchema, refreshTokenSchema, logoutSchema, logoutAllSchema } from '../validations/schemas.js';
// Logger removed - using console
const router = express.Router();
// Apply rate limiting to all auth routes
router.use(authLimiter);
// Helper function to set httpOnly cookies
const setTokenCookies = (res, accessToken, refreshToken) => {
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions = {
        httpOnly: true,
        secure: isProduction, // Only send over HTTPS in production
        sameSite: (isProduction ? 'strict' : 'lax'),
        maxAge: 15 * 60 * 1000, // 15 minutes for access token
        path: '/',
    };
    const refreshCookieOptions = {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days for refresh token
    };
    res.cookie('accessToken', accessToken, cookieOptions);
    res.cookie('refreshToken', refreshToken, refreshCookieOptions);
};
// Helper function to clear token cookies
const clearTokenCookies = (res) => {
    res.clearCookie('accessToken', { path: '/' });
    res.clearCookie('refreshToken', { path: '/' });
};
// Register
router.post('/register', validate(registerSchema), async (req, res, next) => {
    try {
        const { email, password, username } = req.body;
        // Check if user exists
        const existingUser = await queryOne('SELECT * FROM profiles WHERE email = ? OR username = ?', [email, username]);
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        // Create user ID
        const userId = randomUUID();
        // Create profile with password hash
        await insert('INSERT INTO profiles (user_id, username, email, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())', [userId, username, email, hashedPassword]);
        // Set default role as 'user'
        await insert('INSERT INTO user_roles (user_id, role) VALUES (?, ?)', [userId, 'user']);
        // Generate tokens
        const accessToken = generateAccessToken({ userId, email, username });
        const refreshToken = await generateRefreshToken(userId);
        // Set httpOnly cookies
        setTokenCookies(res, accessToken, refreshToken);
        // Also return tokens in response for backward compatibility
        // Frontend can choose to use cookies or localStorage
        res.status(201).json({
            user: { id: userId, email, username, role: 'user' },
            token: accessToken,
            refreshToken
        });
    }
    catch (error) {
        next(error);
    }
});
// Login
router.post('/login', validate(loginSchema), async (req, res, next) => {
    try {
        const { email, password } = req.body;
        // Find user by email
        const profile = await queryOne('SELECT * FROM profiles WHERE email = ?', [email]);
        if (!profile) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        // Verify password
        if (profile.password_hash) {
            const passwordMatch = await bcrypt.compare(password, profile.password_hash);
            if (!passwordMatch) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }
        }
        else {
            // For backward compatibility with existing users without password_hash
            // In production, you should require all users to have password_hash
            console.warn(`User ${profile.email} has no password hash. Please update database.`);
        }
        // Get user role
        const roleData = await queryOne('SELECT role FROM user_roles WHERE user_id = ? ORDER BY CASE role WHEN ? THEN 1 WHEN ? THEN 2 WHEN ? THEN 3 END LIMIT 1', [profile.user_id, 'admin', 'manager', 'user']);
        const role = roleData?.role || 'user';
        // Generate tokens
        const accessToken = generateAccessToken({
            userId: profile.user_id,
            email: profile.email,
            username: profile.username
        });
        const refreshToken = await generateRefreshToken(profile.user_id);
        // Set httpOnly cookies
        setTokenCookies(res, accessToken, refreshToken);
        // Also return tokens in response for backward compatibility
        res.json({
            user: {
                id: profile.user_id,
                email: profile.email,
                username: profile.username,
                role
            },
            token: accessToken,
            refreshToken
        });
    }
    catch (error) {
        next(error);
    }
});
// Refresh token endpoint
router.post('/refresh', validate(refreshTokenSchema), async (req, res, next) => {
    try {
        // Try to get refresh token from cookie first, then from body
        const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;
        if (!refreshToken) {
            return res.status(400).json({ error: 'Refresh token is required' });
        }
        // Verify refresh token
        const tokenData = await verifyRefreshToken(refreshToken);
        // Get user profile
        const profile = await queryOne('SELECT * FROM profiles WHERE user_id = ?', [tokenData.user_id]);
        if (!profile) {
            return res.status(401).json({ error: 'User not found' });
        }
        // Get user role
        const roleData = await queryOne('SELECT role FROM user_roles WHERE user_id = ? ORDER BY CASE role WHEN ? THEN 1 WHEN ? THEN 2 WHEN ? THEN 3 END LIMIT 1', [profile.user_id, 'admin', 'manager', 'user']);
        const role = roleData?.role || 'user';
        // Generate new access token
        const newAccessToken = generateAccessToken({
            userId: profile.user_id,
            email: profile.email,
            username: profile.username
        });
        // Optionally generate new refresh token (rotate refresh tokens for better security)
        const newRefreshToken = await generateRefreshToken(profile.user_id);
        // Revoke old refresh token
        await revokeRefreshToken(refreshToken);
        // Set new httpOnly cookies
        setTokenCookies(res, newAccessToken, newRefreshToken);
        // Also return tokens in response for backward compatibility
        res.json({
            user: {
                id: profile.user_id,
                email: profile.email,
                username: profile.username,
                role
            },
            token: newAccessToken,
            refreshToken: newRefreshToken
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        if (errorMessage === 'Invalid or expired refresh token') {
            return res.status(401).json({ error: errorMessage });
        }
        next(error);
    }
});
// Logout endpoint (revokes refresh token)
router.post('/logout', validate(logoutSchema), async (req, res, next) => {
    try {
        // Try to get refresh token from cookie first, then from body
        const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;
        if (refreshToken) {
            await revokeRefreshToken(refreshToken);
        }
        // Clear cookies
        clearTokenCookies(res);
        res.json({ message: 'Logged out successfully' });
    }
    catch (error) {
        next(error);
    }
});
// Logout all devices (revokes all user's refresh tokens)
router.post('/logout-all', validate(logoutAllSchema), async (req, res, next) => {
    try {
        const { userId } = req.body;
        await revokeAllUserTokens(userId);
        // Clear cookies
        clearTokenCookies(res);
        res.json({ message: 'Logged out from all devices successfully' });
    }
    catch (error) {
        next(error);
    }
});
export default router;
