// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const { database } = require('../config'); // Using your existing config

// Get MySQL pool from config
const db = database.mysqlPool;

module.exports = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    // Extract token
    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production');

    // Get user from database
    const query = 'SELECT user_id, username, name, dept, position, role FROM user WHERE user_id = ?';
    
    db.query(query, [decoded.id], (error, results) => {
      if (error) {
        console.error('Database error:', error);
        return res.status(500).json({
          success: false,
          message: 'Server error during authentication'
        });
      }

      if (results.length === 0) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      const user = results[0];

      // Map role
      let role = 'user';
      if (user.role === 'admin') role = 'admin';
      else if (user.role === 'super-user' || user.role === 'super_user') role = 'super-user';

      // Attach user to request
      req.user = {
        id: user.user_id,
        username: user.username,
        name: user.name,
        dept: user.dept,
        position: user.position,
        role: role
      };

      next();
    });
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error during authentication'
    });
  }
};