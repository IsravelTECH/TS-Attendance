import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../data/db';
import { authenticate, generateToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Sales Representative Login
router.post('/login', (req, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ success: false, message: 'Email and password are required.' });
    return;
  }

  const employee = db.getEmployeeByEmail(email);
  if (!employee || !employee.isActive) {
    res.status(401).json({ success: false, message: 'Invalid credentials or inactive sales account.' });
    return;
  }

  const isValidPassword = bcrypt.compareSync(password, employee.passwordHash);
  if (!isValidPassword) {
    res.status(401).json({ success: false, message: 'Invalid email or password.' });
    return;
  }

  const token = generateToken(employee);
  const { passwordHash, ...sanitized } = employee;

  res.json({
    success: true,
    message: 'Welcome back, ' + employee.fullName,
    token,
    user: sanitized
  });
});

// Current User Profile
router.get('/me', authenticate, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }
  const { passwordHash, ...sanitized } = req.user;
  res.json({ success: true, user: sanitized });
});

// Demo accounts for instant testing
router.get('/demo-accounts', (_req, res: Response) => {
  const accounts = db.getEmployees().map(e => ({
    fullName: e.fullName,
    email: e.email,
    role: e.role,
    designation: e.designation,
    territory: e.territory,
    employeeCode: e.employeeCode,
    defaultPassword: 'techno123'
  }));

  res.json({
    success: true,
    message: 'Techno School Field Sales Demo Accounts',
    defaultPassword: 'techno123',
    accounts
  });
});

export default router;
