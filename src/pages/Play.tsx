import { useI18n } from '../i18n';
import { getWebPlayableGames } from '../utils/data';
import styles from './Play.module.css';

export default function Play() {
  const { t } = useI18n();
  const games = getWebPlayableGames();

  const l = (ko?: string, en?: string) => (en || ko || '');

  return (
    <div className={styles.page}>
      <div className="container">
        <h1 className={styles.pageTitle}>{t('play.title')}</h1>
        <p className={styles.subtitle}>{t('play.subtitle')}</p>

        {games.length > 0 ? (
          <div className={styles.grid}>
            {games.map(game => (
              <a
                key={game.slug}
                href={game.webPlayUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`glass-card ${styles.card} fade-in`}
              >
                <div className={styles.cardThumb}>
                  🌐
                  <div className={styles.overlay}>
                    <span className={styles.playBtn}>▶ {t('play.button')}</span>
                  </div>
                </div>
                <div className={styles.cardBody}>
                  <div className={styles.cardName}>
                    {l(game.name, game.nameEn)}
                  </div>
                  <div className={styles.cardGenre}>{game.genre}</div>
                  <div className={styles.cardMeta}>
                    <div className={styles.cardPlatforms}>
                      {game.platforms.map(p => (
                        <span key={p} className={`badge badge-${p.toLowerCase()}`}>{p}</span>
                      ))}
                    </div>
                    {game.activeCouponCount > 0 && (
                      <span className="badge badge-primary">🎫 {game.activeCouponCount}</span>
                    )}
                  </div>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>{t('play.noGames')}</div>
        )}
      </div>
    </div>
  );
}
