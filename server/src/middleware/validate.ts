/**
 * Validation Middleware
 *
 * Input validation helpers for API endpoints.
 */

import type { Request, Response, NextFunction } from 'express';

// Coupon code format: 5-30 chars, alphanumeric + hyphens
const CODE_REGEX = /^[A-Za-z0-9-]{5,30}$/;

// Game slug format
const SLUG_REGEX = /^[a-z0-9-]{2,50}$/;

export interface ValidatedCoupon {
  gameSlug: string;
  code: string;
  description?: string;
  descriptionEn?: string;
  reward?: string;
  rewardEn?: string;
  issuedDate: string;
  expiryDate?: string | null;
  source?: string;
  sourceUrl?: string;
  confidence?: number;
}

export interface ValidatedReport {
  gameSlug: string;
  code: string;
  description?: string;
  reward?: string;
  sourceUrl?: string;
  honeypot?: string; // hidden field — must be empty
}

export function validateCoupon(req: Request, res: Response, next: NextFunction): void {
  const { gameSlug, code, issuedDate } = req.body;

  if (!gameSlug || !SLUG_REGEX.test(gameSlug)) {
    res.status(400).json({ error: 'Invalid gameSlug' });
    return;
  }

  if (!code || !CODE_REGEX.test(code)) {
    res.status(400).json({ error: 'Invalid coupon code format (5-30 alphanumeric + hyphens)' });
    return;
  }

  if (!issuedDate || !/^\d{4}-\d{2}-\d{2}$/.test(issuedDate)) {
    res.status(400).json({ error: 'Invalid issuedDate (YYYY-MM-DD)' });
    return;
  }

  next();
}

export function validateReport(req: Request, res: Response, next: NextFunction): void {
  const { gameSlug, code, honeypot } = req.body;

  // Honeypot check — bots will fill this hidden field
  if (honeypot) {
    // Silently accept but don't process (looks successful to bots)
    res.status(200).json({ success: true, message: 'Report submitted successfully.' });
    return;
  }

  if (!gameSlug || !SLUG_REGEX.test(gameSlug)) {
    res.status(400).json({ error: 'Please select a game.' });
    return;
  }

  if (!code || !CODE_REGEX.test(code)) {
    res.status(400).json({ error: 'Invalid coupon code format.' });
    return;
  }

  next();
}

export function validateBatchCoupons(req: Request, res: Response, next: NextFunction): void {
  const { coupons } = req.body;

  if (!Array.isArray(coupons) || coupons.length === 0) {
    res.status(400).json({ error: 'coupons must be a non-empty array' });
    return;
  }

  if (coupons.length > 100) {
    res.status(400).json({ error: 'Maximum 100 coupons per batch' });
    return;
  }

  for (const c of coupons) {
    if (!c.gameSlug || !SLUG_REGEX.test(c.gameSlug)) {
      res.status(400).json({ error: `Invalid gameSlug: ${c.gameSlug}` });
      return;
    }
    if (!c.code || !CODE_REGEX.test(c.code)) {
      res.status(400).json({ error: `Invalid code: ${c.code}` });
      return;
    }
  }

  next();
}
