import { Router, Response } from 'express';
import { db } from '../data/db';
import { authenticate } from '../middleware/auth';

const router = Router();

// Get Field Sales Roster
router.get('/', authenticate, (_req, res: Response) => {
  const employees = db.getEmployees().map(e => {
    const { passwordHash, ...rest } = e;
    return rest;
  });

  res.json({
    success: true,
    employees
  });
});

export default router;
