const jwt = require('jsonwebtoken');
const { getUserByEmail } = require('../models/user');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      error: 'Access token required',
      code: 'TOKEN_MISSING'
    });
  }

  jwt.verify(token, JWT_SECRET, async (err, decoded) => {
    if (err) {
      return res.status(403).json({ 
        error: 'Invalid or expired token',
        code: 'TOKEN_INVALID'
      });
    }

    try {
      const user = await getUserByEmail(decoded.email);
      if (!user) {
        return res.status(403).json({ 
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }
      req.user = { email: user.email };
      next();
    } catch (error) {
      return res.status(500).json({ 
        error: 'Authentication failed',
        code: 'AUTH_ERROR'
      });
    }
  });
}

module.exports = { authenticateToken };