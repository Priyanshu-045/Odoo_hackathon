// Author: Priyanshu Pandey | Enrollment: 0801e1241068
import { Router } from 'express';
import cron from 'node-cron';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { runBilling } from '../services/billing.js';

const router = Router();
router.post('/run', requireAuth, requireRole('Admin'), async (_req, res) => {
  res.json(await runBilling());
});
// Scheduled daily at 00:05 server time
export const startBillingCron = () =>
  cron.schedule('5 0 * * *', () => runBilling().then((r) => console.log('[cron] billing', r)).catch(console.error));
export default router;
