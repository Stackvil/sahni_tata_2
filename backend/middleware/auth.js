import jwt from 'jsonwebtoken';
import { readData } from '../utils/dataManager.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * Authentication middleware to protect admin routes
 */
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ detail: 'Authentication required. Please login first.' });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check if user exists
    const data = await readData('users');
    const users = data.users || [];
    const user = users.find(u => u.id === decoded.userId);

    if (!user) {
      return res.status(401).json({ detail: 'User not found. Please login again.' });
    }

    // Attach user info to request
    req.user = {
      id: user.id,
      email: user.email,
      username: user.username
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ detail: 'Token expired. Please login again.' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ detail: 'Invalid token. Please login again.' });
    }
    return res.status(500).json({ detail: 'Authentication error' });
  }
};

/**
 * Optional authentication - doesn't fail if no token, but attaches user if token is valid
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const data = await readData('users');
        const users = data.users || [];
        const user = users.find(u => u.id === decoded.userId);

        if (user) {
          req.user = {
            id: user.id,
            email: user.email,
            username: user.username
          };
        }
      } catch (error) {
        // Invalid token, but continue without authentication
      }
    }
    next();
  } catch (error) {
    next();
  }
};

