import { useI18n } from '../i18n';
import { getShutdownGames, formatDate } from '../utils/data';
import styles from './Memorial.module.css';

export default function Memorial() {
  const { t, locale } = useI18n();
  const games = getShutdownGames();

  const l = (ko?: string, en?: string) => (en || ko || '');

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.hero}>
          <span className={styles.heroIcon}>🕯️</span>
          <h1 className={styles.heroTitle}>{t('memorial.title')}</h1>
          <p className={styles.heroSubtitle}>{t('memorial.subtitle')}</p>
        </div>

        {games.length > 0 ? (
          <div className={styles.cardList}>
            {games.map(game => (
              <article key={game.slug} className={`glass-card ${styles.card} fade-in`}>
                {/* Header: Thumbnail + Name + Description */}
                <div className={styles.cardHeader}>
                  <div className={styles.cardThumb}>🎮</div>
                  <div className={styles.cardInfo}>
                    <h2 className={styles.cardName}>
                      <span className={styles.cardCandle}>🕯️</span>
                      {l(game.name, game.nameEn)}
                    </h2>
                    <div className={styles.cardGenre}>{game.genre}</div>
                    <p className={styles.cardDesc}>
                      {l(game.description, game.descriptionEn)}
                    </p>
                  </div>
                </div>

                {/* Info Grid */}
                <div className={styles.infoGrid}>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>{t('memorial.servicePeriod')}</span>
                    <span className={styles.infoValue}>
                      {formatDate(game.releaseDate, locale)} ~ {formatDate(game.shutdownDate || null, locale)}
                    </span>
                  </div>
                  {game.developer && (
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>{t('memorial.developer')}</span>
                      <span className={styles.infoValue}>{game.developer}</span>
                    </div>
                  )}
                  {game.peakPlayers && (
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>{t('memorial.peakPlayers')}</span>
                      <span className={styles.infoValue}>{game.peakPlayers}</span>
                    </div>
                  )}
                  {game.lastEvent && (
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>{t('memorial.lastEvent')}</span>
                      <span className={`${styles.infoValue} ${styles.infoValueWarning}`}>
                        {l(game.lastEvent, game.lastEventEn)}
                      </span>
                    </div>
                  )}
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>{t('memorial.shutdownDate')}</span>
                    <span className={`${styles.infoValue} ${styles.infoValueDanger}`}>
                      {formatDate(game.shutdownDate || null, locale)}
                    </span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>{t('game.platforms')}</span>
                    <span className={styles.infoValue}>
                      {game.platforms.join(' / ')}
                    </span>
                  </div>
                </div>

                {/* Timeline */}
                {game.timeline && game.timeline.length > 0 && (
                  <div className={styles.timelineSection}>
                    <div className={styles.timelineTitle}>
                      📜 {t('memorial.timeline')}
                    </div>
                    <div className={styles.timeline}>
                      {game.timeline.map((item, i) => (
                        <div key={i} className={styles.timelineItem}>
                          <div className={styles.timelineDot} />
                          <span className={styles.timelineDate}>
                            {formatDate(item.date, locale)}
                          </span>
                          <span className={styles.timelineEvent}>
                            {l(item.event, item.eventEn)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Shutdown Reason */}
                {game.shutdownReason && (
                  <div className={styles.reasonSection}>
                    <div className={styles.reasonLabel}>{t('memorial.shutdownReason')}</div>
                    <div className={styles.reasonText}>
                      {l(game.shutdownReason, game.shutdownReasonEn)}
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div className={styles.cardFooter}>
                  {t('memorial.restInPeace')} 🙏
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>{t('memorial.noGames')}</div>
        )}
      </div>
    </div>
  );
}
