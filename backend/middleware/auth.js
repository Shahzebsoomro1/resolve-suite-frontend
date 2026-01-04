import jwt from 'jsonwebtoken';
import { User } from '../models/models.js';

export const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findOne({ _id: decoded.userId });
      
      if (!user) {
        return res.status(401).json({
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      req.token = token;
      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({
        error: 'Invalid or expired token',
        code: 'INVALID_TOKEN'
      });
    }
  } catch (error) {
    return res.status(401).json({
      error: 'Authentication failed',
      code: 'AUTH_FAILED'
    });
  }
};

export const isSuperAdmin = (req, res, next) => {
  if (req.user.role !== 'SuperAdmin') {
    return res.status(403).send({ error: 'Access denied. SuperAdmin only.' });
  }
  next();
};

export const isSuperAdminOrStudent = (req, res, next) => {
  if (req.user.role !== 'SuperAdmin' && req.user.role !== 'Student') {
    return res.status(403).send({ error: 'Access denied.' });
  }
  next();
};