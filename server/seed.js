// Author: Priyanshu Pandey | Enrollment: 0801e1241068
// Brightloop high-volume demo seeder.  Usage:  node seed.js [--force]
//   - wipes users/products/plans/subscriptions/invoices, then bulk-inserts mock data
//   - deterministic (seeded RNG): same data every run
//   - refuses to run with NODE_ENV=production unless --force
import 'dotenv/config';
import { pathToFileURL } from 'node:url';

export const DEMO_PASSWORD = 'Brightsync@123';   // satisfies the signup regex
const COUNTS = { staff: 2, customers: 50, subs: 5000, active: 4000, cancelled: 400, confirmed: 250, quotation: 200, draft: 150 };

// ---------- deterministic helpers ----------
function mulberry32(a) { return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

/** Pure data generator (no DB) so it can be tested on its own. IDs are 24-hex strings; Mongoose casts them to ObjectId. */
export function generateDataset(now = new Date(), passwordHash = 'HASH_PLACEHOLDER') {
  const rng = mulberry32(20261031);
  const int = (a, b) => a + Math.floor(rng() * (b - a + 1));
  const pick = (arr) => arr[int(0, arr.length - 1)];
  const chance = (p) => rng() < p;
  const shuffle = (arr) => { for (let i = arr.length - 1; i > 0; i--) { const j = int(0, i); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };
  let seq = 0;
  const oid = () => (++seq).toString(16).padStart(8, '0') + Array.from({ length: 16 }, () => int(0, 15).toString(16)).join('');
  const r2 = (x) => Math.round(x * 100) / 100;

  const TODAY = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const day = (offset) => new Date(TODAY + offset * 864e5);
  const MONTHS = { monthly: 1, yearly: 12 };
  const shift = (d, interval, n) => { const x = new Date(d); x.setUTCMonth(x.getUTCMonth() + MONTHS[interval] * n); return x; };

  // ----- users -----
  const first = ['Aarav', 'Vivaan', 'Aditya', 'Ananya', 'Diya', 'Ishaan', 'Kavya', 'Meera', 'Rohan', 'Saanvi', 'Arjun', 'Neha', 'Karan', 'Pooja', 'Rahul', 'Riya', 'Siddharth', 'Tanvi', 'Yash', 'Zoya'];
  const last = ['Sharma', 'Verma', 'Patel', 'Gupta', 'Singh', 'Joshi', 'Mehta', 'Nair', 'Reddy', 'Iyer', 'Kapoor', 'Chauhan', 'Pandey', 'Mishra', 'Jain'];
  const users = [{ _id: oid(), name: 'Brightloop Admin', email: 'admin@brightloop.demo', passwordHash, role: 'Admin' }];
  for (let i = 1; i <= COUNTS.staff; i++) users.push({ _id: oid(), name: `${pick(first)} ${pick(last)}`, email: `staff${i}@brightloop.demo`, passwordHash, role: 'Staff' });
  const customers = [];
  for (let i = 1; i <= COUNTS.customers; i++) {
    const c = { _id: oid(), name: `${pick(first)} ${pick(last)}`, email: `customer${String(i).padStart(2, '0')}@brightloop.demo`, passwordHash, role: 'Customer' };
    customers.push(c); users.push(c);
  }

  // ----- products & plans (3 products, 4 plan variants) -----
  const products = [
    { _id: oid(), name: 'Brightloop Core', description: 'Subscription billing essentials', category: 'Platform', active: true },
    { _id: oid(), name: 'Brightloop Insights', description: 'AI finance dashboard add-on', category: 'Analytics', active: true },
    { _id: oid(), name: 'Brightloop Enterprise', description: 'SSO, audit logs and priority support', category: 'Enterprise', active: true },
  ];
  const plans = [
    { _id: oid(), product: products[0]._id, name: 'Core Monthly', price: 999, interval: 'monthly', tax_rate: 18, discount_pct: 0, active: true, w: 0.40 },
    { _id: oid(), product: products[0]._id, name: 'Core Yearly', price: 9990, interval: 'yearly', tax_rate: 18, discount_pct: 10, active: true, w: 0.20 },
    { _id: oid(), product: products[1]._id, name: 'Insights Monthly', price: 2499, interval: 'monthly', tax_rate: 18, discount_pct: 0, active: true, w: 0.25 },
    { _id: oid(), product: products[2]._id, name: 'Enterprise Yearly', price: 49999, interval: 'yearly', tax_rate: 18, discount_pct: 5, active: true, w: 0.15 },
  ];
  const pickPlan = () => { let r = rng(), acc = 0; for (const p of plans) { acc += p.w; if (r < acc) return p; } return plans[0]; };

  // ----- subscriptions (exact status counts, shuffled) -----
  const statuses = shuffle([
    ...Array(COUNTS.active).fill('active'), ...Array(COUNTS.cancelled).fill('cancelled'),
    ...Array(COUNTS.confirmed).fill('confirmed'), ...Array(COUNTS.quotation).fill('quotation'), ...Array(COUNTS.draft).fill('draft'),
  ]);
  const subscriptions = [], invoices = [];

  statuses.forEach((status) => {
    const plan = pickPlan();
    const sub = {
      _id: oid(),
      customer: customers[Math.floor(rng() ** 1.5 * customers.length)]._id,   // mildly skewed: some customers hold more
      plan: plan._id,
      quantity: pick([1, 1, 1, 2, 2, 3, 5, 10]),
      status, start_date: null, next_billing_date: null,
      discount_pct: pick([0, 0, 0, 0, 5, 10]),
    };

    let anchor = null, nInvoices = 0;
    if (status === 'active') {
      // Staggered: past 30 days -> today -> upcoming. Monthly capped at +28d so its previous period never lands in the future.
      const offset = chance(0.05) ? 0 : (plan.interval === 'monthly' ? int(-30, 28) : int(-30, 60));
      anchor = day(offset); sub.next_billing_date = anchor; nInvoices = 2;
    } else if (status === 'cancelled') {
      anchor = day(int(-45, -1)); nInvoices = 5;               // cancelled: history only, no next billing
    } else if (status === 'confirmed') {
      sub.start_date = sub.next_billing_date = day(int(1, 30)); // confirmed, starts soon
    }

    for (let k = 1; k <= nInvoices; k++) {
      const period_start = shift(anchor, plan.interval, -k);
      const period_end = shift(anchor, plan.interval, -(k - 1));
      const subtotal = plan.price * sub.quantity;
      const discount = subtotal * Math.min(100, plan.discount_pct + sub.discount_pct) / 100;
      const tax = (subtotal - discount) * plan.tax_rate / 100;
      const due_date = new Date(period_start.getTime() + 14 * 864e5);
      let inv = 'paid';
      if (due_date.getTime() >= TODAY) inv = chance(0.4) ? 'paid' : 'confirmed';   // not yet due
      else if (chance(k === 1 ? 0.28 : k === 2 ? 0.06 : 0.02)) inv = 'overdue';
      invoices.push({
        _id: oid(), subscription: sub._id, customer: sub.customer, plan: plan._id,
        period_start, period_end, subtotal: r2(subtotal), discount: r2(discount), tax: r2(tax),
        total: r2(subtotal - discount + tax), status: inv, due_date,
      });
      sub.start_date = period_start;   // ends as the earliest invoiced period
    }
    subscriptions.push(sub);
  });

  plans.forEach((p) => delete p.w);
  return { users, products, plans, subscriptions, invoices };
}

// ---------- DB runner ----------
async function bulk(Model, docs, size = 1000) {
  for (let i = 0; i < docs.length; i += size) await Model.insertMany(docs.slice(i, i + size), { ordered: false });
}
const ms = (t) => `${Date.now() - t} ms`;

async function main() {
  if (process.env.NODE_ENV === 'production' && !process.argv.includes('--force')) {
    console.error('Refusing to seed with NODE_ENV=production (pass --force to override).'); process.exit(1);
  }
  if (!process.env.MONGO_URI) { console.error('MONGO_URI is not set (see .env.example).'); process.exit(1); }

  const { default: mongoose } = await import('mongoose');
  const { default: bcrypt } = await import('bcryptjs');
  const { default: User } = await import('./src/models/User.js');
  const { default: Product } = await import('./src/models/Product.js');
  const { default: Plan } = await import('./src/models/Plan.js');
  const { default: Subscription } = await import('./src/models/Subscription.js');
  const { default: Invoice } = await import('./src/models/Invoice.js');
  const { getMetrics } = await import('./src/services/metrics.js');

  await mongoose.connect(process.env.MONGO_URI);
  console.log(`Connected: ${mongoose.connection.name}`);
  const T = Date.now();

  let t = Date.now();
  const data = generateDataset(new Date(), bcrypt.hashSync(DEMO_PASSWORD, 10));   // one hash shared by all demo users
  console.log(`Generated ${data.users.length} users, ${data.products.length} products, ${data.plans.length} plans, ${data.subscriptions.length} subscriptions, ${data.invoices.length} invoices (${ms(t)})`);

  await Promise.all([User, Product, Plan, Subscription, Invoice].map((M) => M.init()));   // ensure indexes exist
  await Promise.all([User, Product, Plan, Subscription, Invoice].map((M) => M.deleteMany({})));

  for (const [label, Model, docs] of [['users', User, data.users], ['products', Product, data.products], ['plans', Plan, data.plans], ['subscriptions', Subscription, data.subscriptions], ['invoices', Invoice, data.invoices]]) {
    t = Date.now(); await bulk(Model, docs); console.log(`  inserted ${String(docs.length).padStart(6)} ${label.padEnd(14)} ${ms(t)}`);
  }
  console.log(`Seeded in ${ms(T)}`);

  const [bySub, byInv, due] = await Promise.all([
    Subscription.aggregate([{ $group: { _id: '$status', n: { $sum: 1 } } }, { $sort: { n: -1 } }]),
    Invoice.aggregate([{ $group: { _id: '$status', n: { $sum: 1 } } }, { $sort: { n: -1 } }]),
    Subscription.countDocuments({ status: 'active', next_billing_date: { $lte: new Date() } }),
  ]);
  console.log('Subscriptions by status:', Object.fromEntries(bySub.map((x) => [x._id, x.n])));
  console.log('Invoices by status:     ', Object.fromEntries(byInv.map((x) => [x._id, x.n])));
  console.log(`Active subs already due for billing today: ${due}`);

  const m = await getMetrics();
  console.log('Dashboard metrics:', m, m.queryMs < 2000 ? '✔ under 2s' : '✘ OVER 2s');
  console.log(`\nLogin  admin@brightloop.demo / ${DEMO_PASSWORD}   (staff1@..., customer01@... use the same password)`);
  console.log('Author: Priyanshu Pandey | Enrollment: 0801e1241068');
  await mongoose.disconnect();
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main().catch((e) => { console.error(e); process.exit(1); });
