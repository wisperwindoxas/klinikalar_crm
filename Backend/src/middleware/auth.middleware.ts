import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { DatabaseService } from '../database/database.service';
import { PostgresService } from '../database/postgres.service';
import { TenantContext, UserRole } from '../types';

export interface AuthenticatedRequest extends Request {
  user?: TenantContext;
}

export const authenticateJwt = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
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

    let role = (user?.role || payload.role || UserRole.MANAGER) as UserRole;
    let tenantId = user?.tenantId || payload.tenantId || '';
    let branchId = user?.branchId || payload.branchId;

    if (!user) {
      // Check PostgreSQL user store
      try {
        const pg = PostgresService.getInstance();
        const pgRes = await pg.query(
          `SELECT u.id, u.is_active, COALESCE(r.code, 'MANAGER') as role_code, u.clinic_id, u.branch_id
           FROM users u
           LEFT JOIN roles r ON u.role_id = r.id
           WHERE u.id = $1 LIMIT 1`,
          [payload.userId]
        );

        if (pgRes.rows.length > 0) {
          const pgUser = pgRes.rows[0];
          if (pgUser.is_active === false) {
            res.status(401).json({ success: false, message: 'User account is inactive or blocked.' });
            return;
          }
          role = (pgUser.role_code || payload.role || UserRole.MANAGER) as UserRole;
          tenantId = pgUser.clinic_id || tenantId;
          branchId = pgUser.branch_id || branchId;
        } else if (!payload.userId) {
          res.status(401).json({ success: false, message: 'User account not found.' });
          return;
        }
      } catch (dbErr) {
        // Fallback to verified JWT claims if DB has momentary timeout
        if (!payload.userId) {
          res.status(401).json({ success: false, message: 'User account verification failed.' });
          return;
        }
      }
    } else if (user.status !== 'ACTIVE') {
      res.status(401).json({ success: false, message: 'User account is inactive or not found.' });
      return;
    }

    req.user = {
      tenantId: tenantId || '',
      userId: payload.userId,
      role,
      branchId
    };

    // If Super Admin provided x-tenant-id header for tenant-impersonation
    if (role === UserRole.SUPER_ADMIN && req.headers['x-tenant-id']) {
      req.user.tenantId = String(req.headers['x-tenant-id']);
    }

    next();
  } catch (err) {
    res.status(401).json({ success: false, message: 'Invalid or expired authentication token.' });
  }
};

export const optionalAuthenticateJwt = async (req: AuthenticatedRequest, _res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }
  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, config.jwtSecret) as any;
    req.user = {
      tenantId: payload.tenantId || '',
      userId: payload.userId || '',
      role: (payload.role || UserRole.MANAGER) as UserRole,
      branchId: payload.branchId
    };
  } catch (_) {}
  next();
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
