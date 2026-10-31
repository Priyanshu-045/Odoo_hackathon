// Author: Priyanshu Pandey | Enrollment: 0801e1241068
// Usage: node benchmark.js   -> runs the real dashboard aggregations 10x and reports timings vs the 2s budget
import 'dotenv/config';
import mongoose from 'mongoose';
import { getMetrics } from './src/services/metrics.js';
import Subscription from './src/models/Subscription.js';
import Invoice from './src/models/Invoice.js';

await mongoose.connect(process.env.MONGO_URI);
console.log(`Dataset: ${await Subscription.estimatedDocumentCount()} subscriptions, ${await Invoice.estimatedDocumentCount()} invoices`);
const runs = [];
for (let i = 0; i < 10; i++) { const t = performance.now(); await getMetrics(); runs.push(performance.now() - t); }
const avg = runs.reduce((a, b) => a + b, 0) / runs.length;
console.log(`cold: ${runs[0].toFixed(0)} ms | avg: ${avg.toFixed(0)} ms | max: ${Math.max(...runs).toFixed(0)} ms | budget: 2000 ms`);
console.log(Math.max(...runs) < 2000 ? 'PASS: dashboard metrics under 2s' : 'FAIL: over 2s');
console.log('Author: Priyanshu Pandey | Enrollment: 0801e1241068');
await mongoose.disconnect();
