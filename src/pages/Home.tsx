import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useI18n, copyToClipboard } from '../i18n';
import { useGames, useCoupons } from '../hooks/useApi';
import { formatDate, getSourceIcon } from '../utils/data';
import styles from './Home.module.css';

export default function Home() {
  const { t, locale } = useI18n();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { games, loading: gamesLoading } = useGames(true); // include shutdown for memorial
  const { coupons: recentCoupons, loading: couponsLoading } = useCoupons({
    status: 'active',
    limit: 6,
  });

  // Derived data from games
  const activeGames = games.filter(g => !g.isShutdown);
  const webPlayable = games.filter(g => g.webPlayable && !g.isShutdown);
  const upcomingGames = games.filter(g => {
    const today = new Date().toISOString().split('T')[0];
    return g.releaseDate > today && !g.isShutdown;
  });
  const shutdownGames = games.filter(g => g.isShutdown);

  const handleCopy = async (code: string, id: string) => {
    const ok = await copyToClipboard(code);
    if (ok) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  if (gamesLoading || couponsLoading) {
    return (
      <div className={styles.page}>
        <div className="container">
          <div className={styles.loadingState}>Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className="container">
        {/* Today's Coupons */}
        <section className={`${styles.section} fade-in`}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>{t('home.coupons.title')}</h2>
            <Link to="/coupons" className={styles.sectionLink}>
              {t('home.coupons.viewAll')} →
            </Link>
          </div>
          {recentCoupons.length > 0 ? (
            <div className={styles.couponGrid}>
              {recentCoupons.map(coupon => (
                <div key={coupon.id} className={`glass-card ${styles.couponItem}`}>
                  <div className={styles.couponItemHeader}>
                    <span className={styles.couponGameName}>
                      {games.find(g => g.slug === coupon.gameSlug)?.nameEn || coupon.gameSlug}
                    </span>
                    <span className="badge badge-success">{t('coupons.active')}</span>
                  </div>
                  <div
                    className={styles.couponCode}
                    onClick={() => handleCopy(coupon.code, coupon.id)}
                    title={t('coupons.copy')}
                  >
                    {coupon.code}
                    <button
                      className={`${styles.copyBtn} ${copiedId === coupon.id ? styles.copiedBtn : ''}`}
                    >
                      {copiedId === coupon.id ? '✓' : '📋'}
                    </button>
                  </div>
                  <p className={styles.couponDesc}>
                    {coupon.reward || coupon.descriptionEn || coupon.description}
                  </p>
                  <div className={styles.couponMeta}>
                    <span>{getSourceIcon(coupon.source)} {coupon.source}</span>
                    <span>~{formatDate(coupon.expiryDate, locale)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>{t('coupons.noCoupons')}</div>
          )}
        </section>

        {/* Game Cards */}
        <section className={`${styles.section} fade-in`}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>{t('home.games.title')}</h2>
          </div>
          <div className={styles.gameGrid}>
            {activeGames.map(game => (
              <Link
                key={game.slug}
                to={`/games/${game.slug}`}
                className={`glass-card ${styles.gameCard}`}
              >
                <div className={styles.gameThumb}>
                  🎮
                  <div className={styles.gameThumbOverlay}>
                    {game.webPlayable && <span className="badge badge-web">Web</span>}
                  </div>
                </div>
                <div className={styles.gameCardBody}>
                  <div className={styles.gameCardName}>
                    {game.nameEn}
                  </div>
                  <div className={styles.gameCardMeta}>
                    {game.platforms.map(p => (
                      <span key={p} className={`badge badge-${p.toLowerCase()}`}>{p}</span>
                    ))}
                    {game.activeCouponCount > 0 && (
                      <span className="badge badge-primary">
                        🎫 {game.activeCouponCount}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Web Play */}
        {webPlayable.length > 0 && (
          <section className={`${styles.section} fade-in`}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>{t('home.play.title')}</h2>
              <Link to="/play" className={styles.sectionLink}>
                {t('common.viewMore')} →
              </Link>
            </div>
            <div className={styles.playGrid}>
              {webPlayable.map(game => (
                <a
                  key={game.slug}
                  href={game.webPlayUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`glass-card ${styles.playCard}`}
                >
                  <div className={styles.playThumb}>
                    🌐
                    <div className={styles.playOverlay}>
                      <span className={styles.playBtn}>{t('play.button')}</span>
                    </div>
                  </div>
                  <div className={styles.playCardBody}>
                    <div className={styles.playCardName}>
                      {game.nameEn}
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Upcoming Games */}
        {upcomingGames.length > 0 && (
          <section className={`${styles.section} fade-in`}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>{t('home.schedule.title')}</h2>
            </div>
            <div className={styles.scheduleList}>
              {upcomingGames.map(game => (
                <div key={game.slug} className={`glass-card ${styles.scheduleItem}`}>
                  <span className={styles.scheduleGame}>
                    {game.nameEn}
                  </span>
                  <span className={styles.scheduleDate}>
                    {formatDate(game.releaseDate, locale)}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Memorial Preview */}
        {shutdownGames.length > 0 && (
          <section className={`${styles.section} fade-in`}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>{t('home.memorial.title')}</h2>
              <Link to="/memorial" className={styles.sectionLink}>
                {t('common.viewMore')} →
              </Link>
            </div>
            <div className={styles.memorialGrid}>
              {shutdownGames.map(game => (
                <div key={game.slug} className={`glass-card ${styles.memorialCard}`}>
                  <div className={styles.memorialIcon}>🕯️</div>
                  <div className={styles.memorialName}>
                    {game.nameEn}
                  </div>
                  <div className={styles.memorialDate}>
                    {formatDate(game.shutdownDate || null, locale)}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
