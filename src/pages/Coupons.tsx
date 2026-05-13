import { useState, useMemo } from 'react';
import { useI18n, copyToClipboard } from '../i18n';
import { useCoupons, useGames } from '../hooks/useApi';
import { formatDate, getSourceIcon, getSourceLabel } from '../utils/data';
import ReportModal from '../components/ReportModal';
import styles from './Coupons.module.css';

type FilterStatus = 'all' | 'active' | 'expired';

export default function Coupons() {
  const { t, locale } = useI18n();
  const [status, setStatus] = useState<FilterStatus>('all');
  const [gameFilter, setGameFilter] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showReport, setShowReport] = useState(false);

  const { games } = useGames();
  const { coupons, loading } = useCoupons({
    game: gameFilter,
    status: status === 'all' ? undefined : status,
    limit: 100,
  });

  const getGameName = useMemo(() => {
    return (slug: string) => {
      const game = games.find(g => g.slug === slug);
      return game?.nameEn || game?.name || slug;
    };
  }, [games]);

  const handleCopy = async (code: string, id: string) => {
    const ok = await copyToClipboard(code);
    if (ok) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>{t('coupons.title')}</h1>
          <button
            className={`btn btn-primary ${styles.reportBtn}`}
            onClick={() => setShowReport(true)}
          >
            📢 {t('coupons.report') || 'Report Coupon'}
          </button>
        </div>

        <div className={styles.filters}>
          {(['all', 'active', 'expired'] as FilterStatus[]).map(s => (
            <button
              key={s}
              className={`${styles.filterBtn} ${status === s ? styles.filterBtnActive : ''}`}
              onClick={() => setStatus(s)}
            >
              {t(`coupons.filter.${s}`)}
            </button>
          ))}

          <select
            className={styles.gameFilter}
            value={gameFilter}
            onChange={e => setGameFilter(e.target.value)}
          >
            <option value="all">{t('coupons.selectGame')}</option>
            {games.map(g => (
              <option key={g.slug} value={g.slug}>
                {g.nameEn}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className={styles.emptyState}>Loading...</div>
        ) : coupons.length > 0 ? (
          <div className={styles.couponList}>
            {coupons.map(coupon => (
              <div key={coupon.id} className={`glass-card ${styles.couponRow} fade-in`}>
                <span className={styles.couponRowCode}>{coupon.code}</span>
                <span className={styles.couponRowDesc}>
                  {coupon.reward || coupon.descriptionEn || coupon.description}
                </span>
                <span className={styles.couponRowGame}>
                  {getGameName(coupon.gameSlug)}
                </span>
                <span className={styles.couponRowDate}>
                  {formatDate(coupon.expiryDate, locale)}
                  {coupon.expired ? (
                    <span className="badge badge-danger" style={{ marginLeft: 6 }}>
                      {t('coupons.expired')}
                    </span>
                  ) : (
                    <span className="badge badge-success" style={{ marginLeft: 6 }}>
                      {t('coupons.active')}
                    </span>
                  )}
                </span>
                <span className={styles.couponRowSource}>
                  {getSourceIcon(coupon.source)} {getSourceLabel(coupon.source)}
                </span>
                <button
                  className={`${styles.copyBtn} ${copiedId === coupon.id ? styles.copiedBtn : ''}`}
                  onClick={() => handleCopy(coupon.code, coupon.id)}
                >
                  {copiedId === coupon.id ? t('coupons.copied') : t('coupons.copy')}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>{t('coupons.noCoupons')}</div>
        )}
      </div>

      {showReport && (
        <ReportModal
          games={games}
          onClose={() => setShowReport(false)}
        />
      )}
    </div>
  );
}
