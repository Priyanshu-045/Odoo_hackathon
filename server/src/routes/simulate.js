// Author: Priyanshu Pandey | Enrollment: 0801e1241068
import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import Subscription from '../models/Subscription.js';
import { runBilling } from '../services/billing.js';

const router = Router();

/**
 * POST /api/simulate-time   (Admin only)
 * body: { "targetDate": "2027-03-01" }
 * Never touches the OS/Node clock. Rewrites next_billing_date on every active
 * subscription, then runs the same billing engine the cron uses, with asOf = targetDate.
 */
router.post('/', requireAuth, requireRole('Admin'), async (req, res) => {
  const target = new Date(req.body.targetDate);
  if (Number.isNaN(target.getTime()))
    return res.status(400).json({ error: 'Invalid targetDate (ISO, e.g. 2027-03-01)' });

  const moved = await Subscription.updateMany(
    { status: 'active' },
    { $set: { next_billing_date: target } },
  );
  const billing = await runBilling(target);

  res.json({
    targetDate: target.toISOString(),
    subscriptionsMoved: moved.modifiedCount,
    billing,
  });
});
export default router;
