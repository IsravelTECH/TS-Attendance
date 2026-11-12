import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../data/db';
import { Employee, UserRole } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'techno-school-sales-secret-2026';

export interface AuthenticatedRequest extends Request {
  user?: Employee;
}

export function generateToken(employee: Employee): string {
  return jwt.sign(
    {
      id: employee.id,
      email: employee.email,
      role: employee.role,
      fullName: employee.fullName
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Authentication required. Missing Bearer token.' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { id: string };
    const user = db.getEmployeeById(payload.id);
    if (!user || !user.isActive) {
      res.status(401).json({ success: false, message: 'User account disabled or not found.' });
      return;
    }
    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: 'Invalid or expired session token.' });
    return;
  }
}

export function requireRoles(...allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ 
        success: false, 
        message: `Forbidden. Role '${req.user.role}' lacks permission for this resource.` 
      });
      return;
    }
    next();
  };
}
