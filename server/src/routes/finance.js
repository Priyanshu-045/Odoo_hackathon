// Author: Priyanshu Pandey | Enrollment: 0801e1241068
import { Router } from 'express';
import mongoose from 'mongoose';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { financeLimiter } from '../middleware/rateLimit.js';
import { generatePipeline } from '../services/gemini.js';
import { parseModelOutput, GuardError } from '../services/pipelineGuard.js';
import '../models/Subscription.js'; import '../models/Plan.js'; import '../models/Product.js'; import '../models/Invoice.js';

const router = Router();

// POST /api/finance/query   body: { "query": "What is the total revenue for active yearly plans?" }
router.post('/query', financeLimiter, requireAuth, requireRole('Admin', 'Staff'), async (req, res) => {
  const question = typeof req.body?.query === 'string' ? req.body.query.trim() : '';
  if (!question || question.length > 500) return res.status(400).json({ error: 'query must be 1-500 characters' });

  try {
    const modelOutput = await generatePipeline(question);
    if (modelOutput?.error) return res.status(422).json({ error: `Can't answer that: ${modelOutput.error}` });

    const { collection, pipeline } = parseModelOutput(modelOutput);   // validate, then execute
    const t0 = Date.now();
    const results = await mongoose.connection.collection(collection)
      .aggregate(pipeline, { maxTimeMS: 5000, allowDiskUse: false }).toArray();

    res.json({ question, collection, pipeline, results, ms: Date.now() - t0 });
  } catch (e) {
    if (e instanceof GuardError) return res.status(422).json({ error: `Generated query rejected: ${e.message}` });
    if (e.codeName === 'MaxTimeMSExpired') return res.status(504).json({ error: 'Query took too long' });
    if (e.status) return res.status(e.status).json({ error: e.message });
    console.error(e);
    res.status(500).json({ error: 'Failed to run finance query' });
  }
});
export default router;
