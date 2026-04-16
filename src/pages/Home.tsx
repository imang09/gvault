import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../i18n';
import {
  getAllGames,
  getRecentCoupons,
  getWebPlayableGames,
  getAllResellListings,
  getUpcomingGames,
  getShutdownGames,
  getGameName,
  formatDate,
  getSourceIcon,
} from '../utils/data';
import styles from './Home.module.css';

export default function Home() {
  const { t, locale } = useI18n();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const games = getAllGames();
  const recentCoupons = getRecentCoupons(6);
  const webPlayable = getWebPlayableGames();
  const resellListings = getAllResellListings().slice(0, 5);
  const upcomingGames = getUpcomingGames();
  const shutdownGames = getShutdownGames();

  const handleCopy = async (code: string, id: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className={styles.page}>
      {/* Hero */}
      <section className={styles.hero}>
        <div className="container">
          <h1 className={styles.heroTitle}>{t('home.hero.title')}</h1>
          <p className={styles.heroSubtitle}>{t('home.hero.subtitle')}</p>
        </div>
      </section>

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
                      {getGameName(coupon.gameSlug, locale)}
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
                    {locale === 'ko' ? coupon.description : coupon.descriptionEn || coupon.description}
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
            {games.map(game => (
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
                    {locale === 'ko' ? game.name : game.nameEn}
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
                      {locale === 'ko' ? game.name : game.nameEn}
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Resell Preview */}
        {resellListings.length > 0 && (
          <section className={`${styles.section} fade-in`}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>{t('home.resell.title')}</h2>
              <Link to="/resell" className={styles.sectionLink}>
                {t('common.viewMore')} →
              </Link>
            </div>
            <div className={styles.resellList}>
              {resellListings.map(item => (
                <div key={item.id} className={`glass-card ${styles.resellItem}`}>
                  <span className={styles.resellGame}>
                    {getGameName(item.gameSlug, locale)}
                  </span>
                  <span className={styles.resellInfo}>
                    Lv.{item.accountLevel}
                  </span>
                  <span className={styles.resellInfo}>
                    SSR×{item.ssrCount}
                  </span>
                  <span className={styles.resellInfo}>
                    {locale === 'ko' ? item.server : item.serverEn || item.server}
                  </span>
                  <span className={styles.resellPrice}>
                    {item.price}
                  </span>
                </div>
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
                    {locale === 'ko' ? game.name : game.nameEn}
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
                    {locale === 'ko' ? game.name : game.nameEn}
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
