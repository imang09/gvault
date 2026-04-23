import { useParams, Link } from 'react-router-dom';
import { useI18n } from '../i18n';
import { getGameBySlug, formatDate } from '../utils/data';
import styles from './GameDetail.module.css';

export default function GameDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { t, locale } = useI18n();
  const game = slug ? getGameBySlug(slug) : undefined;

  if (!game) {
    return (
      <div className={styles.page}>
        <div className="container">
          <div className={styles.notFound}>{t('game.notFound')}</div>
        </div>
      </div>
    );
  }

  const navItems = [
    { to: `/games/${slug}/characters`, icon: '👤', label: t('game.characters') },
    { to: `/coupons?game=${slug}`, icon: '🎫', label: t('game.coupons') },
    ...(game.webPlayable ? [{ to: game.webPlayUrl || '#', icon: '🌐', label: t('game.play'), external: true }] : []),
    { to: `/resell/${slug}`, icon: '💎', label: t('game.resell') },
  ];

  return (
    <div className={styles.page}>
      <div className="container">
        <Link to="/" className={styles.backLink}>← {t('common.back')}</Link>

        <div className={styles.header}>
          <div className={styles.thumb}>🎮</div>
          <div className={styles.info}>
            <h1 className={styles.gameName}>
              {game.nameEn}
            </h1>
            <div className={styles.gameGenre}>{game.genre}</div>
            <div className={styles.platforms}>
              {game.platforms.map(p => (
                <span key={p} className={`badge badge-${p.toLowerCase()}`}>{p}</span>
              ))}
              {game.webPlayable && <span className="badge badge-success">{t('game.webPlayable')}</span>}
            </div>
            <div className={styles.meta}>
              <span>{t('game.releaseDate')}: {formatDate(game.releaseDate, locale)}</span>
              {game.activeCouponCount > 0 && (
                <span>🎫 {game.activeCouponCount} {t('coupons.activeCoupons')}</span>
              )}
            </div>
            <p className={styles.desc}>
              {game.descriptionEn || game.description}
            </p>
            <div className={styles.links}>
              <a href={game.officialSite} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                {t('game.officialSite')} ↗
              </a>
              {game.storeLinks.android && (
                <a href={game.storeLinks.android} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
                  Android ↗
                </a>
              )}
              {game.storeLinks.ios && (
                <a href={game.storeLinks.ios} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
                  iOS ↗
                </a>
              )}
            </div>
          </div>
        </div>

        <div className={styles.navGrid}>
          {navItems.map((item, i) => (
            'external' in item && item.external ? (
              <a key={i} href={item.to} target="_blank" rel="noopener noreferrer" className={`glass-card ${styles.navCard}`}>
                <div className={styles.navIcon}>{item.icon}</div>
                <div className={styles.navLabel}>{item.label}</div>
              </a>
            ) : (
              <Link key={i} to={item.to} className={`glass-card ${styles.navCard}`}>
                <div className={styles.navIcon}>{item.icon}</div>
                <div className={styles.navLabel}>{item.label}</div>
              </Link>
            )
          ))}
        </div>
      </div>
    </div>
  );
}
