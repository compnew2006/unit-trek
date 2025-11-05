# Security Policy

## 🔒 Security Measures Implemented

### 1. Input Sanitization

**Location**: `src/utils/sanitize.ts`

- ✅ HTML sanitization to prevent XSS attacks
- ✅ String sanitization for user inputs
- ✅ Barcode validation and sanitization
- ✅ Email validation
- ✅ URL sanitization (blocks dangerous protocols)
- ✅ File upload validation (type and size checks)
- ✅ Recursive object sanitization

**Usage**:
```typescript
import { sanitizeHtml, sanitizeBarcode, validateFile } from '@/utils/sanitize';

// Sanitize user input
const safeInput = sanitizeHtml(userInput);

// Validate barcode
const cleanBarcode = sanitizeBarcode(barcodeInput);

// Validate file upload
const result = validateFile(file, {
  maxSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['.xlsx', '.csv']
});
```

### 2. Rate Limiting

**Client-Side**:
- **Location**: `src/utils/rateLimiter.ts`
- ✅ Client-side rate limiting
- ✅ Configurable limits per endpoint
- ✅ Automatic cleanup of expired records
- ✅ React hook for easy integration
- ✅ Applied to all API requests (30 requests/minute default)

**Server-Side** (PRODUCTION):
- **Location**: `server/src/middleware/rateLimiter.js`
- ✅ **General API limiter**: 100 requests per 15 minutes per IP
- ✅ **Auth limiter**: 5 requests per 15 minutes per IP (login/register)
- ✅ **Write limiter**: 50 requests per 15 minutes per IP (POST/PUT/DELETE)
- ✅ **User limiter**: 200 requests per 15 minutes per authenticated user
- ✅ Applied to all routes with appropriate limits
- ✅ Returns 429 status with retry-after headers
- ✅ Standard rate limit headers (RateLimit-*)

**Configuration**:
```javascript
// Server-side: Multiple rate limiters for different use cases
// Client-side: 30 requests per minute per endpoint
```

### 3. JWT Token Management

**Status**: ✅ **PRODUCTION READY**

- ✅ Access tokens (15 minutes expiry)
- ✅ Refresh tokens (7 days expiry)
- ✅ Token rotation on refresh
- ✅ Token revocation support
- ✅ Automatic token refresh
- ✅ **httpOnly cookies** for secure token storage (PRODUCTION)
- ✅ Backward compatibility with localStorage (Authorization header)
- ✅ Token cleanup on logout and 401 errors

**Security Implementation**:
- ✅ **httpOnly cookies** prevent XSS token theft
- ✅ Cookies set with `secure` flag in production (HTTPS only)
- ✅ Cookies set with `sameSite: strict` in production
- ✅ Authentication middleware checks cookies first, then headers
- ✅ Frontend automatically sends cookies with `credentials: 'include'`
- ✅ Tokens still returned in response for backward compatibility
- ✅ Refresh tokens are rotated on each use
- ✅ Database tracks refresh tokens for revocation

**Migration Notes**:
- Backend automatically sets httpOnly cookies on login/register/refresh
- Frontend continues to work with localStorage (backward compatible)
- Both methods supported simultaneously for smooth migration
- Production recommendation: Use cookies only (more secure)

### 4. API Security

**Location**: `src/services/apiClient.ts`

- ✅ Custom `ApiError` class for structured error handling
- ✅ Retry logic with exponential backoff
- ✅ Rate limiting on all requests
- ✅ Input sanitization on create/update operations
- ✅ Automatic token refresh on 401 errors
- ✅ Request queuing during token refresh

### 5. Error Handling

**Location**: `src/components/ErrorBoundary.tsx`

- ✅ React Error Boundary for graceful error handling
- ✅ Prevents sensitive information leakage
- ✅ User-friendly error messages
- ✅ Detailed errors only in development mode

### 6. Backend Security

**Location**: `server/src/`

- ✅ JWT authentication on all protected routes
- ✅ **httpOnly cookie support** for token storage
- ✅ Password hashing with bcrypt (10 rounds)
- ✅ SQL injection prevention (parameterized queries)
- ✅ CORS configuration with credentials support
- ✅ **Enhanced Helmet.js** with CSP headers
- ✅ **HSTS** (HTTP Strict Transport Security)
- ✅ **XSS protection** headers
- ✅ **NoSniff** content-type protection
- ✅ **Referrer Policy** configuration
- ✅ Request logging with Morgan
- ✅ **Payload size limits** (10MB max)
- ✅ **Zod validation schemas** for all endpoints
- ✅ **Server-side rate limiting** (multiple tiers)

## 🚨 Known Limitations & Recommendations

### 1. Token Storage
**Status**: ✅ **IMPLEMENTED** - httpOnly cookies now available

**Current Implementation**:
- ✅ Backend sets httpOnly cookies automatically
- ✅ Frontend sends cookies with all requests
- ✅ Backward compatible with localStorage (Authorization header)
- ✅ Both methods work simultaneously

**Production Recommendation**:
- Use httpOnly cookies only (remove localStorage fallback)
- Already configured with `secure` flag for HTTPS
- Already configured with `sameSite: strict` for CSRF protection

**Migration Steps** (if removing localStorage):
1. ✅ Backend sets httpOnly cookies (DONE)
2. ✅ CORS configured with credentials: true (DONE)
3. ✅ Frontend sends cookies with requests (DONE)
4. ⚠️ Optional: Remove localStorage token storage (keep for compatibility)

### 2. Content Security Policy
**Status**: ✅ **IMPLEMENTED**
- ✅ CSP headers configured via Helmet
- ✅ Restrictive directives for production
- ✅ Allows necessary resources (self, data URIs)
- ✅ Blocks inline scripts/styles (except for development)
- ✅ No frames allowed (frameSrc: 'none')
- ✅ No objects allowed (objectSrc: 'none')

**Production Recommendation**:
- Review and tighten CSP for production
- Remove 'unsafe-inline' and 'unsafe-eval' if possible
- Use nonces or hashes for inline scripts/styles

### 3. HTTPS
**Status**: Development uses HTTP
**Requirement**: MUST use HTTPS in production
- Protects against MITM attacks
- Required for secure cookies
- Encrypts all data in transit

### 4. Input Validation
**Status**: ✅ **IMPLEMENTED**
- ✅ **Zod validation schemas** for all endpoints
- ✅ Comprehensive validation middleware
- ✅ Type-safe validation with detailed error messages
- ✅ Validates body, params, and query parameters
- ✅ Client-side sanitization still applied as additional layer

**Validation Coverage**:
- ✅ Authentication (register, login, refresh, logout)
- ✅ Items (create, update, bulk create)
- ✅ Warehouses (create, update)
- ✅ Movements (create)
- ✅ Users (update)
- ✅ History (query parameters)

**Implementation**:
```javascript
// Example: Using validation middleware
router.post('/items', validate(createItemSchema), async (req, res) => {
  // req.body is now validated and type-safe
});
```

### 5. Rate Limiting
**Status**: ✅ **IMPLEMENTED** - Both client and server-side

**Server-Side Rate Limiting**:
- ✅ **express-rate-limit** installed and configured
- ✅ Multiple rate limiters for different use cases
- ✅ IP-based limiting
- ✅ User-based limiting (after authentication)
- ✅ Standard rate limit headers
- ✅ Configurable retry-after information

**Rate Limit Tiers**:
- General API: 100 requests / 15 min / IP
- Authentication: 5 requests / 15 min / IP
- Write operations: 50 requests / 15 min / IP
- User operations: 200 requests / 15 min / user

**Recommendation**: Monitor and adjust limits based on production traffic

## 📋 Security Checklist

### Frontend
- [x] Input sanitization
- [x] XSS prevention
- [x] Client-side rate limiting
- [x] Error boundary
- [x] Token management
- [ ] Content Security Policy
- [ ] httpOnly cookies (planned)

### Backend
- [x] JWT authentication
- [x] Password hashing
- [x] SQL injection prevention
- [x] CORS configuration
- [x] Security headers (Helmet)
- [x] Request logging
- [x] Server-side rate limiting ✅ **IMPLEMENTED**
- [x] Input validation schemas (Zod) ✅ **IMPLEMENTED**
- [x] httpOnly cookies ✅ **IMPLEMENTED**
- [x] CSP headers ✅ **IMPLEMENTED**
- [x] HSTS headers ✅ **IMPLEMENTED**
- [ ] API documentation (recommended)

### Infrastructure
- [ ] HTTPS in production (REQUIRED)
- [ ] Environment variables properly secured
- [ ] Database credentials encrypted
- [ ] Regular security audits
- [ ] Dependency vulnerability scanning

## 🔍 Regular Security Maintenance

### 1. Dependency Updates
```bash
# Check for vulnerabilities
npm audit

# Update dependencies
npm update

# Fix vulnerabilities automatically
npm audit fix
```

### 2. Code Reviews
- Review all user input handling
- Check for hardcoded credentials
- Verify authentication on all protected routes
- Test error handling

### 3. Monitoring
- Monitor failed login attempts
- Track unusual API activity
- Log security-related events
- Set up alerts for suspicious behavior

## 📞 Reporting Security Issues

If you discover a security vulnerability, please email [security@example.com] instead of using the issue tracker.

**Do not publicly disclose security vulnerabilities.**

## 🔄 Updates

This security policy is reviewed and updated regularly. Last update: 2025-11-05

## 📚 Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [React Security Best Practices](https://snyk.io/blog/10-react-security-best-practices/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)

