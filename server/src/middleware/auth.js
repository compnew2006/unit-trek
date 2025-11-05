import jwt from 'jsonwebtoken';

export const authenticateToken = (req, res, next) => {
  // Try to get token from cookie first (httpOnly), then from Authorization header (backward compatibility)
  let token = req.cookies?.accessToken;
  
  if (!token) {
    const authHeader = req.headers['authorization'];
    token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  }

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};
