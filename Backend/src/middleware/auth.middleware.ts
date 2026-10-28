import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { DatabaseService } from '../database/database.service';
import { TenantContext, UserRole } from '../types';

export interface AuthenticatedRequest extends Request {
  user?: TenantContext;
}

export const authenticateJwt = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Authentication required. Bearer token missing.' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, config.jwtSecret) as any;
    const db = DatabaseService.getInstance();
    const user = db.getUserById(payload.userId);

    if (!user || user.status !== 'ACTIVE') {
      res.status(401).json({ success: false, message: 'User account is inactive or not found.' });
      return;
    }

    req.user = {
      tenantId: user.tenantId || '',
      userId: user.id,
      role: user.role,
      branchId: user.branchId
    };

    // If Super Admin provided x-tenant-id header for tenant-impersonation
    if (user.role === UserRole.SUPER_ADMIN && req.headers['x-tenant-id']) {
      req.user.tenantId = String(req.headers['x-tenant-id']);
    }

    next();
  } catch (err) {
    res.status(401).json({ success: false, message: 'Invalid or expired authentication token.' });
  }
};

export const requireRoles = (allowedRoles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    if (req.user.role === UserRole.SUPER_ADMIN || allowedRoles.includes(req.user.role)) {
      next();
      return;
    }

    res.status(403).json({
      success: false,
      message: `Access denied. Role '${req.user.role}' is not authorized for this operation.`
    });
  };
};

export const enforceTenantBoundary = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Authentication required.' });
    return;
  }

  // Super Admin has global override if allowed
  if (req.user.role === UserRole.SUPER_ADMIN) {
    next();
    return;
  }

  if (!req.user.tenantId) {
    res.status(403).json({ success: false, message: 'No tenant context associated with this user.' });
    return;
  }

  // Check if clinic subscription is expired or suspended
  const db = DatabaseService.getInstance();
  const sub = db.getSubscriptionByTenant(req.user.tenantId);
  if (sub && sub.status === 'SUSPENDED') {
    res.status(403).json({
      success: false,
      code: 'SUBSCRIPTION_SUSPENDED',
      message: 'Ushbu klinika obunasi to\'xtatilgan (SUSPENDED). Iltimos, Super Admin bilan bog\'laning.'
    });
    return;
  }

  next();
};
