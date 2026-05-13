/**
 * Rate Limit Middleware
 *
 * IP-based rate limiting for user-facing endpoints (reports).
 * Uses in-memory store (sufficient for single-server deployment).
 */

import rateLimit from 'express-rate-limit';

// General API rate limit: 100 requests per 15 minutes
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

// Report submission: 5 per hour per IP
export const reportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many reports. Please try again in an hour.' },
  keyGenerator: (req) => {
    return req.ip || req.headers['x-forwarded-for'] as string || 'unknown';
  },
});

// Daily report limit: 20 per day per IP
export const dailyReportLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Daily report limit reached. Please try again tomorrow.' },
  keyGenerator: (req) => {
    return req.ip || req.headers['x-forwarded-for'] as string || 'unknown';
  },
});
