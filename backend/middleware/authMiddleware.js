// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const { database } = require('../config');

const db = database.mysqlPool;

module.exports = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    console.log('🔍 [AUTH] Request received');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ [AUTH] No Bearer token');
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const token = authHeader.split(' ')[1];
    console.log('🔍 [AUTH] Token received');

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production');
    console.log('🔍 [AUTH] Token verified, user ID:', decoded.id);

    // ✅ USE PROMISE-BASED QUERY WITH AWAIT
    const query = 'SELECT user_id, username, name, dept, position, role FROM user WHERE user_id = ?';
    const [results] = await db.query(query, [decoded.id]);

    console.log('🔍 [AUTH] Database query completed, results:', results.length);

    if (results.length === 0) {
      console.log('❌ [AUTH] User not found');
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = results[0];
    console.log('🔍 [AUTH] User found:', user.username, 'Dept:', user.dept);

    // Map role
    let role = 'user';
    if (user.role === 'admin') role = 'admin';
    else if (user.role === 'super-user' || user.role === 'super_user') role = 'super-user';

    // Attach user to request
    req.user = {
      user_id: user.user_id,
      username: user.username,
      name: user.name,
      dept: user.dept,
      position: user.position,
      role: role
    };

    console.log('✅ [AUTH] Auth successful, proceeding to route');
    next();

  } catch (error) {
    console.error('❌ [AUTH] Auth middleware error:', error.message);
    
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