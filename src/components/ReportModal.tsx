/**
 * ReportModal Component
 *
 * User coupon report form with anti-abuse measures:
 * - Honeypot hidden field (bot detection)
 * - Client-side format validation
 * - Rate limit feedback from API
 */

import { useState } from 'react';
import api, { type GameResponse, ApiError } from '../utils/api';
import styles from './ReportModal.module.css';

interface ReportModalProps {
  games: GameResponse[];
  onClose: () => void;
}

export default function ReportModal({ games, onClose }: ReportModalProps) {
  const [gameSlug, setGameSlug] = useState('');
  const [code, setCode] = useState('');
  const [reward, setReward] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!gameSlug || !code) return;

    // Basic client-side validation
    if (!/^[A-Za-z0-9-]{5,30}$/.test(code)) {
      setResult({ success: false, message: 'Invalid coupon code format (5-30 alphanumeric characters).' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.submitReport({
        gameSlug,
        code,
        reward,
        sourceUrl,
        honeypot, // hidden field — bots will fill this
      });
      setResult({ success: true, message: res.message });
    } catch (err) {
      if (err instanceof ApiError) {
        setResult({ success: false, message: (err.data as { error?: string })?.error || err.message });
      } else {
        setResult({ success: false, message: 'Network error. Please try again.' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>✕</button>

        <h2 className={styles.title}>📢 Report a Coupon</h2>
        <p className={styles.subtitle}>
          Found a coupon code? Share it with the community!
          Submitted codes will be reviewed before being published.
        </p>

        {result ? (
          <div className={`${styles.result} ${result.success ? styles.resultSuccess : styles.resultError}`}>
            <p>{result.success ? '✅' : '❌'} {result.message}</p>
            <button className="btn btn-primary" onClick={onClose}>Close</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.field}>
              <label htmlFor="report-game">Game *</label>
              <select
                id="report-game"
                value={gameSlug}
                onChange={e => setGameSlug(e.target.value)}
                required
              >
                <option value="">Select a game...</option>
                {games.filter(g => !g.isShutdown).map(g => (
                  <option key={g.slug} value={g.slug}>{g.nameEn}</option>
                ))}
              </select>
            </div>

            <div className={styles.field}>
              <label htmlFor="report-code">Coupon Code *</label>
              <input
                id="report-code"
                type="text"
                value={code}
                onChange={e => setCode(e.target.value.trim())}
                placeholder="e.g. ArkTrist2ws0"
                maxLength={30}
                required
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="report-reward">Reward (optional)</label>
              <input
                id="report-reward"
                type="text"
                value={reward}
                onChange={e => setReward(e.target.value)}
                placeholder="e.g. 100 Diamonds + 50 Stamina"
                maxLength={200}
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="report-source">Source URL (optional)</label>
              <input
                id="report-source"
                type="url"
                value={sourceUrl}
                onChange={e => setSourceUrl(e.target.value)}
                placeholder="https://twitter.com/..."
                maxLength={500}
              />
            </div>

            {/* Honeypot — hidden from real users, bots will fill it */}
            <div style={{ position: 'absolute', left: '-9999px', opacity: 0 }} aria-hidden="true">
              <label htmlFor="report-website">Website</label>
              <input
                id="report-website"
                type="text"
                value={honeypot}
                onChange={e => setHoneypot(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
              />
            </div>

            <button
              type="submit"
              className={`btn btn-primary ${styles.submitBtn}`}
              disabled={submitting || !gameSlug || !code}
            >
              {submitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
