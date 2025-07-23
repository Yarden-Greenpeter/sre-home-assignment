const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const { getUserByEmail, createUser } = require('../models/user');
const { validateEmail, validatePassword } = require('../utils/validation');
const { authenticateToken } = require('../middleware/auth');
const kafkaService = require('../services/kafka-service');
const { logUserActivity } = require('../utils/logger');


const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production';

// Rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    error: 'Too many authentication attempts, please try again later',
    code: 'RATE_LIMIT_EXCEEDED'
  }
});

// POST /login - Enhanced with structured logging
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

  logUserActivity(
    email,
    'login_attempt', 
    req.ip,
    { 
      user_agent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    }
  );

    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email and password are required',
        code: 'MISSING_CREDENTIALS'
      });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ 
        error: 'Please provide a valid email address',
        code: 'INVALID_EMAIL'
      });
    }

    const user = await getUserByEmail(email.toLowerCase().trim());
    if (!user) {
      // Log failed login attempt with structured JSON format
      logUserActivity(
        email.toLowerCase().trim(),
        'login_failed',
        req.ip,
        { 
          reason: 'user_not_found',
          user_agent: req.get('User-Agent'),
          timestamp: new Date().toISOString()
        }
      );
      
      await kafkaService.publishUserActivity(
        email.toLowerCase().trim(),
        'login_failed',
        { reason: 'user_not_found', ip: req.ip }
      );
      
      return res.status(401).json({ 
        error: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      // Log failed login attempt
      logUserActivity(
        user.email,
        'login_failed',
        req.ip,
        { 
          reason: 'invalid_password',
          user_agent: req.get('User-Agent'),
          timestamp: new Date().toISOString()
        }
      );
      
      await kafkaService.publishUserActivity(
        user.email,
        'login_failed',
        { reason: 'invalid_password', ip: req.ip }
      );
      
      return res.status(401).json({ 
        error: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      });
    }

    const token = jwt.sign(
      { email: user.email }, 
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Log successful login with structured JSON format as required
    logUserActivity(
      user.email,
      'login_success',
      req.ip,
      { 
        user_agent: req.get('User-Agent'),
        timestamp: new Date().toISOString(),
        session_duration: '24h'
      }
    );

    await kafkaService.publishUserActivity(
      user.email,
      'login_success',
      { ip: req.ip, user_agent: req.get('User-Agent') }
    );

    res.json({ 
      success: true,
      message: 'Login successful',
      token,
      user: {
        email: user.email
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'An error occurred during login',
      code: 'SERVER_ERROR'
    });
  }
});

module.exports = router;
