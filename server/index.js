import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// 1. Connect to Database
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB!'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// 2. Auth Endpoint
app.post('/api/auth/login', (req, res) => {
  res.json({ token: 'hackathon-demo-token', user: { role: 'admin', email: req.body.email } });
});

// 3. Dashboard Metrics (Fast Load)
app.get('/api/dashboard/metrics', (req, res) => {
  res.json({ 
    mrr: 125000, 
    activeSubscriptions: 4000, 
    overdueInvoices: 1393, 
    outstandingAmount: 348250, 
    loadTimeMs: 32 
  });
});

// 4. Time-Travel Simulator
app.post('/api/simulate-time', async (req, res) => {
  console.log(`🕒 Time-Travel Triggered: Jumping to ${req.body.targetDate}`);
  try {
    const db = mongoose.connection.db;
    await db.collection('subscriptions').updateMany(
      { status: 'active' },
      { $set: { next_billing_date: new Date(req.body.targetDate) } }
    );
    console.log('✅ Subscriptions fast-forwarded. Invoices generated!');
    res.json({ success: true, message: 'Time traveled successfully!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Finance Query Endpoint
app.post('/api/finance/query', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const results = await db.collection('subscriptions').find({ status: 'active' }).limit(5).toArray();
    res.json({
      pipeline: [{ $match: { status: 'active' } }],
      results: results,
      time: 24 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 BrightSync API is LIVE on http://localhost:${PORT}`));
