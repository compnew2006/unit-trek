# JWT Token Refresh Implementation Guide

## Overview
This document explains the JWT token refresh mechanism implemented in the application. The system uses short-lived access tokens (15 minutes) and long-lived refresh tokens (7 days) for enhanced security.

## Architecture

### Backend Components

1. **Refresh Tokens Table** (`server/src/migrations/add_refresh_tokens.sql`)
   - Stores refresh tokens with expiration dates
   - Tracks revoked tokens
   - Linked to user profiles with foreign key

2. **Token Helpers** (`server/src/utils/tokenHelpers.js`)
   - `generateAccessToken`: Creates short-lived JWT tokens (15m)
   - `generateRefreshToken`: Creates long-lived refresh tokens (7d)
   - `verifyRefreshToken`: Validates refresh tokens
   - `revokeRefreshToken`: Revokes a single refresh token
   - `revokeAllUserTokens`: Revokes all user's tokens (logout from all devices)
   - `cleanupExpiredTokens`: Removes expired tokens from database

3. **Auth Routes** (`server/src/routes/auth.js`)
   - `/auth/register`: Returns both access and refresh tokens
   - `/auth/login`: Returns both access and refresh tokens
   - `/auth/refresh`: Exchanges refresh token for new access token
   - `/auth/logout`: Revokes refresh token
   - `/auth/logout-all`: Revokes all user's refresh tokens

### Frontend Components

1. **API Client** (`src/services/apiClient.ts`)
   - `getRefreshToken`, `setRefreshToken`: Manage refresh tokens in localStorage
   - `refreshAccessToken`: Exchanges refresh token for new access token
   - Automatic token refresh on 401 errors
   - Prevents multiple simultaneous refresh attempts
   - Queues requests during token refresh

2. **Auth API**
   - Stores both access and refresh tokens on login/register
   - Sends refresh token on logout
   - Provides refresh method

## Token Lifecycle

```
1. User Login
   ↓
2. Backend generates:
   - Access Token (15m)
   - Refresh Token (7d)
   ↓
3. Frontend stores both tokens
   ↓
4. API requests use Access Token
   ↓
5. Access Token expires (after 15m)
   ↓
6. API returns 401 Unauthorized
   ↓
7. Frontend automatically:
   - Sends Refresh Token to /auth/refresh
   - Gets new Access Token
   - Retries original request
   ↓
8. Continue working seamlessly
   ↓
9. Refresh Token expires (after 7d)
   ↓
10. User must log in again
```

## Configuration

### Backend (.env)
```env
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

### Token Expiry Times
- **Access Token**: 15 minutes (short-lived for security)
- **Refresh Token**: 7 days (long-lived for convenience)

## Security Features

1. **Refresh Token Rotation**
   - New refresh token issued on each refresh
   - Old refresh token is revoked
   - Prevents token reuse

2. **Token Revocation**
   - Refresh tokens can be revoked individually
   - All user tokens can be revoked (logout from all devices)
   - Revoked tokens are tracked in database

3. **Automatic Cleanup**
   - Expired tokens can be removed from database
   - Revoked tokens older than 30 days can be deleted

4. **Request Queuing**
   - Multiple requests wait for single token refresh
   - Prevents refresh token race conditions

## Usage Examples

### Login
```typescript
const { user, token, refreshToken } = await api.auth.signIn(email, password);
// Both tokens are automatically stored in localStorage
```

### Automatic Refresh (Transparent to User)
```typescript
// Make any API request
const data = await api.items.getAll();
// If access token expired:
// 1. Frontend automatically refreshes token
// 2. Original request is retried
// 3. Data is returned seamlessly
```

### Manual Refresh
```typescript
try {
  const newToken = await api.auth.refresh();
  console.log('Token refreshed:', newToken);
} catch (error) {
  // Refresh failed, redirect to login
}
```

### Logout
```typescript
await api.auth.signOut();
// Refresh token is revoked on backend
// All tokens removed from localStorage
```

## Testing

### Test Access Token Expiry
1. Login to the application
2. Wait 16 minutes (access token expires after 15m)
3. Make any API request (e.g., navigate to inventory page)
4. Token should refresh automatically
5. Check browser console for refresh messages:
   - "🔄 Access token expired, attempting refresh..."
   - "✅ Token refreshed, retrying request..."

### Test Refresh Token Expiry
1. Login to the application
2. Manually set a short refresh token expiry in backend `.env`:
   ```env
   JWT_REFRESH_EXPIRES_IN=1m
   ```
3. Wait 2 minutes
4. Try to make an API request
5. Should redirect to login page

### Test Logout
1. Login to the application
2. Click logout
3. Check that refresh token is revoked in database:
   ```sql
   SELECT * FROM refresh_tokens WHERE user_id = 'your-user-id';
   ```
   - Should show `revoked = TRUE`

## Database Migrations

To add refresh tokens support to existing database:

```bash
cd server
node src/migrations/run-refresh-tokens-migration.js
```

This will:
1. Add `password_hash` column to `profiles` table
2. Create `refresh_tokens` table
3. Create indexes for performance

## Troubleshooting

### Issue: Token not refreshing
- Check browser console for errors
- Verify `JWT_REFRESH_EXPIRES_IN` in backend `.env`
- Ensure refresh token is stored in localStorage

### Issue: Redirect to login immediately
- Check if refresh token exists in localStorage
- Verify refresh token is not expired
- Check backend logs for refresh errors

### Issue: Multiple refresh attempts
- This is prevented by the queuing mechanism
- Check for race conditions in code

## Best Practices

1. **Never store tokens in cookies** without `HttpOnly` flag
2. **Use HTTPS** in production
3. **Keep access tokens short-lived** (15m or less)
4. **Implement token cleanup** as scheduled job
5. **Monitor refresh token usage** for security issues
6. **Rotate refresh tokens** on each use
7. **Revoke tokens on password change**
8. **Implement rate limiting** on refresh endpoint

## Future Enhancements

1. **Token Blacklist**: Track revoked access tokens
2. **Device Management**: Show active sessions per user
3. **Biometric Auth**: Integrate fingerprint/face recognition
4. **2FA Support**: Two-factor authentication
5. **Token Analytics**: Monitor token usage patterns
6. **Refresh Token Families**: Detect token theft

## References

- [RFC 6749 - OAuth 2.0](https://datatracker.ietf.org/doc/html/rfc6749)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

