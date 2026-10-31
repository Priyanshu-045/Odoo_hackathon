// Author: Priyanshu Pandey | Enrollment: 0801e1241068
import rateLimit from 'express-rate-limit';

// 10 requests / minute / IP on the Gemini-backed route (protects API quota)
export const financeLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',     // RateLimit + RateLimit-Policy headers (client can read Retry-After)
  legacyHeaders: false,
  message: { error: 'Too many finance queries: limit is 10 per minute. Please wait a moment and try again.' },
});
