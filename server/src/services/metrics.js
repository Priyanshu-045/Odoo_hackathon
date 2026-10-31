// Author: Priyanshu Pandey | Enrollment: 0801e1241068
import Subscription from '../models/Subscription.js';
import Invoice from '../models/Invoice.js';

// Normalise any billing interval to a monthly amount
const monthlyFactor = {
  $switch: { branches: [
    { case: { $eq: ['$plan.interval', 'weekly'] }, then: 52 / 12 },
    { case: { $eq: ['$plan.interval', 'quarterly'] }, then: 1 / 3 },
    { case: { $eq: ['$plan.interval', 'yearly'] }, then: 1 / 12 },
  ], default: 1 },
};

export async function getMetrics() {
  const t0 = Date.now();
  const [subAgg, overdueAgg] = await Promise.all([
    Subscription.aggregate([
      { $match: { status: 'active' } },
      { $lookup: { from: 'plans', localField: 'plan', foreignField: '_id', as: 'plan',
          pipeline: [{ $project: { price: 1, interval: 1, discount_pct: 1 } }] } },
      { $unwind: '$plan' },
      { $group: { _id: null, active: { $sum: 1 },
          mrr: { $sum: { $multiply: [
            '$plan.price', '$quantity', monthlyFactor,
            { $subtract: [1, { $divide: [{ $min: [100, { $add: ['$plan.discount_pct', '$discount_pct'] }] }, 100] }] },
          ] } } } },
    ]),
    Invoice.aggregate([
      { $match: { status: { $in: ['confirmed', 'overdue'] }, due_date: { $lt: new Date() } } },
      { $group: { _id: null, count: { $sum: 1 }, amount: { $sum: '$total' } } },
    ]),
  ]);
  return {
    mrr: Math.round((subAgg[0]?.mrr ?? 0) * 100) / 100,
    activeSubscriptions: subAgg[0]?.active ?? 0,
    overdueInvoices: overdueAgg[0]?.count ?? 0,
    overdueAmount: Math.round((overdueAgg[0]?.amount ?? 0) * 100) / 100,
    queryMs: Date.now() - t0,
  };
}
