// Author: Priyanshu Pandey | Enrollment: 0801e1241068
import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { getMetrics } from '../services/metrics.js';

const router = Router();
router.get('/metrics', requireAuth, requireRole('Admin', 'Staff'), async (_req, res) => {
  res.json(await getMetrics());
});
export default router;
