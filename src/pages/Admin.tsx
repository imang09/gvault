/**
 * Admin Dashboard
 *
 * Protected admin page for managing coupon reports.
 * Features:
 * - API Key login gate
 * - Dashboard stats overview
 * - Report review queue (approve/reject)
 * - Coupon management quick view
 *
 * Reference: Inspired by Supabase Dashboard / Vercel Admin patterns
 */

import { useState, useEffect, useCallback } from 'react';
import styles from './Admin.module.css';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

/* ===== Types ===== */
interface AdminStats {
  totalCoupons: number;
  activeCoupons: number;
  totalGames: number;
  pendingReports: number;
  timestamp: string;
}

interface Report {
  id: number;
  gameSlug: string;
  code: string;
  description: string;
  reward: string;
  sourceUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  submitterHash: string;
  createdAt: string;
}

interface Coupon {
  id: string;
  gameSlug: string;
  code: string;
  descriptionEn: string;
  reward: string;
  issuedDate: string;
  expiryDate: string | null;
  expired: boolean;
  source: string;
  createdAt: string;
}

interface CouponsResponse {
  coupons: Coupon[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

/* ===== Helpers ===== */
async function adminFetch<T>(path: string, apiKey: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

/* ===== Login Gate ===== */
function LoginGate({ onLogin }: { onLogin: (key: string) => void }) {
  const [key, setKey] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim()) return;

    setChecking(true);
    setError('');

    try {
      // Validate key by attempting an admin-only endpoint
      await adminFetch('/reports?status=pending&limit=1', key.trim());
      localStorage.setItem('gvault_admin_key', key.trim());
      onLogin(key.trim());
    } catch {
      setError('Invalid API key or server error');
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className={styles.loginPage}>
      <div className={styles.loginCard}>
        <div className={styles.loginIcon}>🔐</div>
        <h1 className={styles.loginTitle}>Gvault Admin</h1>
        <p className={styles.loginSubtitle}>Enter your API key to access the admin dashboard</p>

        <form onSubmit={handleSubmit} className={styles.loginForm}>
          <input
            type="password"
            value={key}
            onChange={e => setKey(e.target.value)}
            placeholder="API Key"
            className={styles.loginInput}
            autoFocus
          />
          {error && <div className={styles.loginError}>{error}</div>}
          <button type="submit" className={`btn btn-primary ${styles.loginBtn}`} disabled={checking}>
            {checking ? 'Verifying...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ===== Stats Cards ===== */
function StatsBar({ stats }: { stats: AdminStats | null }) {
  if (!stats) return null;

  const cards = [
    { label: 'Total Coupons', value: stats.totalCoupons, icon: '🎫', color: 'var(--accent-primary)' },
    { label: 'Active', value: stats.activeCoupons, icon: '✅', color: 'var(--accent-secondary)' },
    { label: 'Games', value: stats.totalGames, icon: '🎮', color: 'var(--accent-info)' },
    { label: 'Pending Reports', value: stats.pendingReports, icon: '📋', color: stats.pendingReports > 0 ? 'var(--accent-warning)' : 'var(--text-tertiary)' },
  ];

  return (
    <div className={styles.statsGrid}>
      {cards.map(c => (
        <div key={c.label} className={styles.statCard}>
          <div className={styles.statIcon}>{c.icon}</div>
          <div className={styles.statInfo}>
            <div className={styles.statValue} style={{ color: c.color }}>{c.value}</div>
            <div className={styles.statLabel}>{c.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ===== Report Queue ===== */
function ReportQueue({ apiKey }: { apiKey: string }) {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [actionMsg, setActionMsg] = useState<{ id: number; msg: string; ok: boolean } | null>(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const params = statusFilter !== 'all' ? `?status=${statusFilter}&limit=50` : '?limit=50';
      const data = await adminFetch<{ reports: Report[] }>(`/reports${params}`, apiKey);
      setReports(data.reports || []);
    } catch {
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, [apiKey, statusFilter]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const handleAction = async (id: number, action: 'approved' | 'rejected') => {
    try {
      await adminFetch(`/reports/${id}`, apiKey, {
        method: 'PATCH',
        body: JSON.stringify({ status: action }),
      });
      setActionMsg({ id, msg: action === 'approved' ? 'Approved ✅' : 'Rejected ❌', ok: action === 'approved' });
      setTimeout(() => {
        setActionMsg(null);
        fetchReports();
      }, 1200);
    } catch (e) {
      setActionMsg({ id, msg: (e as Error).message, ok: false });
      setTimeout(() => setActionMsg(null), 3000);
    }
  };

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>📋 Report Queue</h2>
        <div className={styles.filterGroup}>
          {(['pending', 'approved', 'rejected', 'all'] as const).map(s => (
            <button
              key={s}
              className={`${styles.filterChip} ${statusFilter === s ? styles.filterChipActive : ''}`}
              onClick={() => setStatusFilter(s)}
            >
              {s === 'pending' ? '⏳' : s === 'approved' ? '✅' : s === 'rejected' ? '❌' : '📊'} {s}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className={styles.emptyState}>Loading reports...</div>
      ) : reports.length === 0 ? (
        <div className={styles.emptyState}>
          {statusFilter === 'pending' ? '🎉 No pending reports — all clear!' : `No ${statusFilter} reports`}
        </div>
      ) : (
        <div className={styles.reportList}>
          <div className={styles.reportHeader}>
            <span>Game</span>
            <span>Code</span>
            <span>Reward</span>
            <span>Source</span>
            <span>Submitted</span>
            <span>Status</span>
            <span>Actions</span>
          </div>
          {reports.map(r => (
            <div key={r.id} className={`${styles.reportRow} ${actionMsg?.id === r.id ? styles.reportRowFlash : ''}`}>
              <span className={styles.reportGame}>{r.gameSlug}</span>
              <span className={styles.reportCode}>{r.code}</span>
              <span className={styles.reportReward}>{r.reward || '—'}</span>
              <span className={styles.reportSource}>
                {r.sourceUrl ? (
                  <a href={r.sourceUrl} target="_blank" rel="noopener noreferrer" className={styles.reportSourceLink}>
                    Link ↗
                  </a>
                ) : '—'}
              </span>
              <span className={styles.reportDate}>
                {new Date(r.createdAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
              <span>
                <span className={`badge ${r.status === 'pending' ? 'badge-warning' : r.status === 'approved' ? 'badge-success' : 'badge-danger'}`}>
                  {r.status}
                </span>
              </span>
              <span className={styles.reportActions}>
                {actionMsg?.id === r.id ? (
                  <span className={actionMsg.ok ? styles.actionOk : styles.actionFail}>{actionMsg.msg}</span>
                ) : r.status === 'pending' ? (
                  <>
                    <button className={styles.approveBtn} onClick={() => handleAction(r.id, 'approved')} title="Approve">✅</button>
                    <button className={styles.rejectBtn} onClick={() => handleAction(r.id, 'rejected')} title="Reject">❌</button>
                  </>
                ) : (
                  <span className={styles.reportDone}>—</span>
                )}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ===== Coupon List ===== */
function CouponList({ apiKey }: { apiKey: string }) {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    adminFetch<CouponsResponse>(`/coupons?page=${page}&limit=20`, apiKey)
      .then((data: CouponsResponse) => {
        setCoupons(data.coupons);
        setPagination(data.pagination);
      })
      .catch(() => setCoupons([]))
      .finally(() => setLoading(false));
  }, [apiKey, page]);

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>🎫 Coupons ({pagination.total})</h2>
        <div className={styles.paginationControls}>
          <button className={styles.pageBtn} disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
          <span className={styles.pageInfo}>{page} / {pagination.totalPages}</span>
          <button className={styles.pageBtn} disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
        </div>
      </div>

      {loading ? (
        <div className={styles.emptyState}>Loading coupons...</div>
      ) : (
        <div className={styles.couponTable}>
          <div className={styles.couponHeader}>
            <span>Game</span>
            <span>Code</span>
            <span>Reward / Description</span>
            <span>Source</span>
            <span>Issued</span>
            <span>Status</span>
          </div>
          {coupons.map(c => (
            <div key={c.id} className={styles.couponRow}>
              <span className={styles.couponGame}>{c.gameSlug}</span>
              <span className={styles.couponCode}>{c.code}</span>
              <span className={styles.couponDesc}>{c.reward || c.descriptionEn || '—'}</span>
              <span className={styles.couponSource}>{c.source}</span>
              <span className={styles.couponDate}>{c.issuedDate}</span>
              <span>
                <span className={`badge ${c.expired ? 'badge-danger' : 'badge-success'}`}>
                  {c.expired ? 'Expired' : 'Active'}
                </span>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ===== Main Admin Page ===== */
export default function Admin() {
  const [apiKey, setApiKey] = useState<string | null>(() =>
    localStorage.getItem('gvault_admin_key')
  );
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [activeTab, setActiveTab] = useState<'reports' | 'coupons'>('reports');

  // Validate stored key on mount
  useEffect(() => {
    if (!apiKey) return;
    adminFetch<AdminStats>('/stats', apiKey)
      .then(setStats)
      .catch(() => {
        localStorage.removeItem('gvault_admin_key');
        setApiKey(null);
      });
  }, [apiKey]);

  const handleLogout = () => {
    localStorage.removeItem('gvault_admin_key');
    setApiKey(null);
    setStats(null);
  };

  if (!apiKey) {
    return <LoginGate onLogin={setApiKey} />;
  }

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <div className={styles.topBarLeft}>
          <span className={styles.topBarIcon}>⚙️</span>
          <h1 className={styles.topBarTitle}>Admin Dashboard</h1>
        </div>
        <button className={`btn btn-ghost ${styles.logoutBtn}`} onClick={handleLogout}>
          Logout
        </button>
      </div>

      <div className={styles.content}>
        <StatsBar stats={stats} />

        <div className={styles.tabBar}>
          <button
            className={`${styles.tab} ${activeTab === 'reports' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('reports')}
          >
            📋 Reports {stats && stats.pendingReports > 0 && (
              <span className={styles.tabBadge}>{stats.pendingReports}</span>
            )}
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'coupons' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('coupons')}
          >
            🎫 Coupons
          </button>
        </div>

        {activeTab === 'reports' ? (
          <ReportQueue apiKey={apiKey} />
        ) : (
          <CouponList apiKey={apiKey} />
        )}
      </div>
    </div>
  );
}
