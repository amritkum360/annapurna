import { verifyToken } from '../utils/token.js';
import User from '../models/User.js';

/**
 * Middleware to authenticate requests using JWT Bearer token
 */
export const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication token missing. Please log in.'
      });
    }

    // Verify token
    const decoded = verifyToken(token);

    // Fetch user from DB (excluding password)
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'The user belonging to this token no longer exists.'
      });
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      status: 'error',
      message: 'Invalid or expired token. Please log in again.'
    });
  }
};

/**
 * Middleware to restrict route access by role
 * Example usage: authorize('admin'), authorize('donor', 'ngo')
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: `Forbidden: Access restricted to [${roles.join(', ')}] role(s)`
      });
    }
    next();
  };
};
