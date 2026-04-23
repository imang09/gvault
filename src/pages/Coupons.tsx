import { useState, useMemo } from 'react';
import { useI18n, copyToClipboard } from '../i18n';
import {
  getAllCoupons,
  getAllGames,
  getGameName,
  formatDate,
  getSourceIcon,
  getSourceLabel,
} from '../utils/data';
import styles from './Coupons.module.css';

type FilterStatus = 'all' | 'active' | 'expired';

export default function Coupons() {
  const { t, locale } = useI18n();
  const [status, setStatus] = useState<FilterStatus>('all');
  const [gameFilter, setGameFilter] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const allCoupons = getAllCoupons();
  const games = getAllGames();

  const filtered = useMemo(() => {
    let result = allCoupons;
    if (status === 'active') result = result.filter(c => !c.expired);
    if (status === 'expired') result = result.filter(c => c.expired);
    if (gameFilter !== 'all') result = result.filter(c => c.gameSlug === gameFilter);
    return result.sort((a, b) => b.issuedDate.localeCompare(a.issuedDate));
  }, [allCoupons, status, gameFilter]);

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
        <h1 className={styles.pageTitle}>{t('coupons.title')}</h1>

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

        {filtered.length > 0 ? (
          <div className={styles.couponList}>
            {filtered.map(coupon => (
              <div key={coupon.id} className={`glass-card ${styles.couponRow} fade-in`}>
                <span className={styles.couponRowCode}>{coupon.code}</span>
                <span className={styles.couponRowDesc}>
                  {coupon.descriptionEn || coupon.description}
                </span>
                <span className={styles.couponRowGame}>
                  {getGameName(coupon.gameSlug, locale)}
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
    </div>
  );
}
