import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { readData, writeData } from '../utils/dataManager.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const RESET_TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

/**
 * @swagger
 * components:
 *   schemas:
 *     AuthResponse:
 *       type: object
 *       properties:
 *         access_token:
 *           type: string
 *         token_type:
 *           type: string
 *         user:
 *           type: object
 */

/**
 * @swagger
 * /api/auth/signup:
 *   post:
 *     summary: User signup
 *     tags: [Authentication]
 *     parameters:
 *       - in: query
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: password
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 */
// POST /api/auth/signup - User signup
router.post('/signup', async (req, res) => {
  try {
    const { username, email, password } = req.query;

    if (!username || !email || !password) {
      return res.status(400).json({ detail: 'Username, email, and password are required' });
    }

    // Try database first
    try {
      const { usersDB } = await import('../utils/dbManager.js');
      const existingUser = await usersDB.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({ detail: 'User with this email already exists' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create in database
      const newUser = await usersDB.create({
        username,
        email,
        password: hashedPassword,
        role: 'user'
      });

      // Generate token
      const token = jwt.sign({ userId: newUser.id, email }, JWT_SECRET, { expiresIn: '7d' });

      return res.status(201).json({
        access_token: token,
        token_type: 'bearer',
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email
        }
      });
    } catch (dbError) {
      // On Vercel, database must be available - don't fall back to filesystem
      if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
        console.error('[Auth] Database signup failed on Vercel/Production:', dbError.message);
        return res.status(500).json({ 
          detail: 'Database connection failed. Please check your database configuration.',
          error: process.env.NODE_ENV !== 'production' ? dbError.message : undefined
        });
      }
      
      // Local development: fallback to JSON files
      console.log('[Auth] Database signup failed, using JSON files:', dbError.message);
      
      try {
        const data = await readData('users');
        const users = data.users || [];

        // Check if user already exists
        if (users.find(u => u.email === email)) {
          return res.status(400).json({ detail: 'User with this email already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = {
          id: users.length + 1,
          username,
          email,
          password: hashedPassword,
          createdAt: new Date().toISOString()
        };

        users.push(newUser);
        await writeData('users', { users });

        // Generate token
        const token = jwt.sign({ userId: newUser.id, email }, JWT_SECRET, { expiresIn: '7d' });

        return res.status(201).json({
          access_token: token,
          token_type: 'bearer',
          user: {
            id: newUser.id,
            username: newUser.username,
            email: newUser.email
          }
        });
      } catch (fileError) {
        console.error('[Auth] File system fallback also failed:', fileError.message);
        return res.status(500).json({ detail: 'Failed to create user. Database and file system both unavailable.' });
      }
    }
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: User login
 *     tags: [Authentication]
 *     parameters:
 *       - in: query
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: password
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.query;

    if (!email || !password) {
      return res.status(400).json({ detail: 'Email and password are required' });
    }

    let user = null;

    // Try database first
    try {
      const { usersDB } = await import('../utils/dbManager.js');
      const { query } = await import('../config/database.js');
      const result = await query('SELECT * FROM users WHERE email = $1', [email]);
      if (result.rows && result.rows.length > 0) {
        user = result.rows[0];
      }
    } catch (dbError) {
      // Database not available or query failed, continue to JSON
      console.log('[Auth] Database check failed, trying JSON files:', dbError.message);
    }

    // If not found in database, try JSON files
    if (!user) {
      try {
        const data = await readData('users');
        const users = data.users || [];
        user = users.find(u => u.email === email);
      } catch (jsonError) {
        console.log('[Auth] JSON file check failed:', jsonError.message);
      }
    }

    if (!user) {
      return res.status(401).json({ detail: 'Invalid email or password' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ detail: 'Invalid email or password' });
    }

    // Generate token
    const token = jwt.sign({ userId: user.id, email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      access_token: token,
      token_type: 'bearer',
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// POST /api/auth/forgot-password - Forgot password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ detail: 'Email is required' });
    }

    const data = await readData('users');
    const users = data.users || [];
    const user = users.find(u => u.email === email);

    // Don't reveal if user exists or not (security best practice)
    if (!user) {
      // Still return success to prevent email enumeration
      return res.json({ message: 'If an account exists with this email, password reset instructions have been sent.' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + RESET_TOKEN_EXPIRY);

    // Save reset token to user
    const userIndex = users.findIndex(u => u.id === user.id);
    users[userIndex] = {
      ...users[userIndex],
      resetToken,
      resetTokenExpiry: resetTokenExpiry.toISOString()
    };

    await writeData('users', { users });

    // In a real application, you would send an email with the reset token
    // For now, we'll return the token in development (remove in production!)
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}#reset-password?token=${resetToken}`;
    
    console.log(`[Password Reset] Token for ${email}: ${resetToken}`);
    console.log(`[Password Reset] Reset link: ${resetLink}`);

    // In production, send email instead of logging
    res.json({ 
      message: 'If an account exists with this email, password reset instructions have been sent.',
      // Remove this in production - only for development
      ...(process.env.NODE_ENV !== 'production' && { resetToken, resetLink })
    });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// POST /api/auth/reset-password - Reset password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, new_password } = req.query;

    if (!token || !new_password) {
      return res.status(400).json({ detail: 'Token and new password are required' });
    }

    if (new_password.length < 6) {
      return res.status(400).json({ detail: 'Password must be at least 6 characters long' });
    }

    const data = await readData('users');
    const users = data.users || [];
    
    // Find user with matching reset token
    const user = users.find(u => 
      u.resetToken === token && 
      u.resetTokenExpiry && 
      new Date(u.resetTokenExpiry) > new Date()
    );

    if (!user) {
      return res.status(400).json({ detail: 'Invalid or expired reset token' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(new_password, 10);

    // Update user password and clear reset token
    const userIndex = users.findIndex(u => u.id === user.id);
    users[userIndex] = {
      ...users[userIndex],
      password: hashedPassword,
      resetToken: undefined,
      resetTokenExpiry: undefined
    };

    await writeData('users', { users });

    res.json({ message: 'Password reset successfully. You can now login with your new password.' });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// POST /api/auth/init-admin - Initialize admin user (creates if doesn't exist)
router.post('/init-admin', async (req, res) => {
  try {
    const adminEmail = 'admin@sahni.com';
    const adminPassword = 'admin123';
    const adminUsername = 'admin';

    // Try database first
    try {
      const { usersDB } = await import('../utils/dbManager.js');
      const existingAdmin = await usersDB.findByEmail(adminEmail);
      
      if (existingAdmin) {
        return res.json({
          success: true,
          message: 'Admin user already exists',
          user: {
            id: existingAdmin.id,
            username: existingAdmin.username,
            email: existingAdmin.email
          }
        });
      }

      // Create admin in database
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      const newAdmin = await usersDB.create({
        username: adminUsername,
        email: adminEmail,
        password: hashedPassword,
        role: 'admin'
      });

      return res.json({
        success: true,
        message: 'Admin user created in database',
        user: {
          id: newAdmin.id,
          username: newAdmin.username,
          email: newAdmin.email
        },
        credentials: {
          email: adminEmail,
          password: adminPassword
        }
      });
    } catch (dbError) {
      // Database not available, use JSON files
      console.log('[Auth] Database init-admin failed, using JSON files:', dbError.message);
    }

    // Fallback to JSON files
    const data = await readData('users');
    const users = data.users || [];

    // Check if admin already exists
    const existingAdmin = users.find(u => u.email === adminEmail);
    if (existingAdmin) {
      return res.json({
        success: true,
        message: 'Admin user already exists in JSON files',
        user: {
          id: existingAdmin.id,
          username: existingAdmin.username,
          email: existingAdmin.email
        }
      });
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    const newAdmin = {
      id: users.length + 1,
      username: adminUsername,
      email: adminEmail,
      password: hashedPassword,
      role: 'admin',
      createdAt: new Date().toISOString()
    };

    users.push(newAdmin);
    await writeData('users', { users });

    res.json({
      success: true,
      message: 'Admin user created in JSON files',
      user: {
        id: newAdmin.id,
        username: newAdmin.username,
        email: newAdmin.email
      },
      credentials: {
        email: adminEmail,
        password: adminPassword
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      detail: error.message 
    });
  }
});

export default router;

