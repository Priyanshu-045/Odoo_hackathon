// Author: Priyanshu Pandey | Enrollment: 0801e1241068
import Subscription from '../models/Subscription.js';
import Invoice from '../models/Invoice.js';

const addInterval = (d, interval) => {
  const n = new Date(d);
  if (interval === 'weekly') n.setDate(n.getDate() + 7);
  else if (interval === 'monthly') n.setMonth(n.getMonth() + 1);
  else if (interval === 'quarterly') n.setMonth(n.getMonth() + 3);
  else n.setFullYear(n.getFullYear() + 1);
  return n;
};
const r2 = (x) => Math.round(x * 100) / 100;

/** Generate draft invoices for every active subscription due on/before asOf. */
export async function runBilling(asOf = new Date()) {
  const due = await Subscription.find({ status: 'active', next_billing_date: { $lte: asOf } })
    .populate('plan').lean();
  let created = 0, skipped = 0;

  for (const sub of due) {
    if (!sub.plan) { skipped++; continue; }
    const { plan } = sub;
    const period_start = sub.next_billing_date;
    const period_end = addInterval(period_start, plan.interval);
    const subtotal = plan.price * sub.quantity;
    const discount = subtotal * Math.min(100, plan.discount_pct + sub.discount_pct) / 100;
    const tax = (subtotal - discount) * plan.tax_rate / 100;
    try {
      await Invoice.create({
        subscription: sub._id, customer: sub.customer, plan: plan._id,
        period_start, period_end,
        subtotal: r2(subtotal), discount: r2(discount), tax: r2(tax), total: r2(subtotal - discount + tax),
        status: 'draft', due_date: new Date(period_start.getTime() + 14 * 864e5),
      });
      created++;
    } catch (e) {
      if (e.code !== 11000) throw e;   // duplicate period = already billed
      skipped++;
    }
    await Subscription.updateOne({ _id: sub._id }, { next_billing_date: period_end });
  }
  return { processed: due.length, created, skipped, asOf };
}
