import jwt from 'jsonwebtoken';
import { AppError } from '../utils/AppError.js';

/**
 * Verifies the Bearer token in the Authorization header and attaches
 * the decoded payload to req.user for downstream handlers to use for
 * org-scoping every query (multi-tenant isolation).
 */
export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError(401, 'UNAUTHORIZED', 'Missing or malformed Authorization header'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, orgId, branchId, role }
    next();
  } catch (err) {
    return next(new AppError(401, 'UNAUTHORIZED', 'Invalid or expired token'));
  }
}
