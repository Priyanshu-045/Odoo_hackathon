// Author: Priyanshu Pandey | Enrollment: 0801e1241068
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.js';
import billingRoutes, { startBillingCron } from './routes/billing.js';
import simulateRoutes from './routes/simulate.js';
import dashboardRoutes from './routes/dashboard.js';
import financeRoutes from './routes/finance.js';

const app = express();
// Behind a reverse proxy (Render/Nginx)? set TRUST_PROXY=1 so rate limiting sees the real client IP
if (process.env.TRUST_PROXY) app.set('trust proxy', Number(process.env.TRUST_PROXY));
app.use(helmet(), cors(), express.json());
app.use('/api/auth', authRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/simulate-time', simulateRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/finance', financeRoutes);
app.use((err, _req, res, _next) => { console.error(err); res.status(500).json({ error: 'Server error' }); });

await mongoose.connect(process.env.MONGO_URI);
await mongoose.syncIndexes();
startBillingCron();
app.listen(process.env.PORT || 5000, () => console.log('BrightSync API up'));
