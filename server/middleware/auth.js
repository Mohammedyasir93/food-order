import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { asyncHandler } from './asyncHandler.js';

export const requireAuth = asyncHandler(async (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Please sign in to continue.' });
  }

  try {
    const payload = jwt.verify(authorization.slice(7), process.env.JWT_SECRET);
    const user = await User.findById(payload.sub).select('_id name email role');
    if (!user) return res.status(401).json({ message: 'Your session is no longer valid.' });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: 'Your session is invalid or has expired.' });
  }
});

export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Administrator access is required.' });
  }
  next();
}