import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useI18n } from '../i18n';
import { getAllResellListings, getResellByGame, getAllGames, getGameName, formatDate } from '../utils/data';
import styles from './Resell.module.css';

export default function Resell() {
  const { gameSlug } = useParams<{ gameSlug?: string }>();
  const { t, locale } = useI18n();
  const [gameFilter, setGameFilter] = useState<string>(gameSlug || 'all');
  const games = getAllGames();

  const listings = useMemo(() => {
    if (gameSlug) return getResellByGame(gameSlug);
    if (gameFilter !== 'all') return getResellByGame(gameFilter);
    return getAllResellListings();
  }, [gameSlug, gameFilter]);

  return (
    <div className={styles.page}>
      <div className="container">
        <h1 className={styles.pageTitle}>{t('resell.title')}</h1>

        <div className={styles.disclaimer}>
          ⚠️ {t('resell.disclaimer')}
        </div>

        {!gameSlug && (
          <div className={styles.filters}>
            <select
              className={styles.gameFilter}
              value={gameFilter}
              onChange={e => setGameFilter(e.target.value)}
            >
              <option value="all">{t('coupons.selectGame')}</option>
              {games.map(g => (
                <option key={g.slug} value={g.slug}>
                  {locale === 'ko' ? g.name : g.nameEn}
                </option>
              ))}
            </select>
          </div>
        )}

        {listings.length > 0 ? (
          <div className={styles.grid}>
            {listings.map(item => (
              <div key={item.id} className={`glass-card ${styles.card} fade-in`}>
                <div className={styles.cardHeader}>
                  <span className={styles.cardGame}>{getGameName(item.gameSlug, locale)}</span>
                  <span className={styles.cardPrice}>{item.price}</span>
                </div>

                <div className={styles.cardStats}>
                  <div className={styles.cardStat}>
                    <div className={styles.cardStatLabel}>{t('resell.level')}</div>
                    <div className={styles.cardStatValue}>{item.accountLevel}</div>
                  </div>
                  <div className={styles.cardStat}>
                    <div className={styles.cardStatLabel}>{t('resell.ssr')}</div>
                    <div className={styles.cardStatValue}>{item.ssrCount}</div>
                  </div>
                  <div className={styles.cardStat}>
                    <div className={styles.cardStatLabel}>{t('resell.sr')}</div>
                    <div className={styles.cardStatValue}>{item.srCount}</div>
                  </div>
                </div>

                <p className={styles.cardDesc}>
                  {locale === 'ko' ? item.description : item.descriptionEn || item.description}
                </p>

                <div className={styles.cardFooter}>
                  <div>
                    <div className={styles.cardContact}>
                      {t('resell.contact')}: {item.contact}
                    </div>
                    <div>
                      {t('resell.server')}: {locale === 'ko' ? item.server : item.serverEn || item.server}
                    </div>
                  </div>
                  <div className={styles.cardSource}>
                    {item.sourceUrl ? (
                      <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" className={styles.cardSourceLink}>
                        {item.source} ↗
                      </a>
                    ) : (
                      <span>{item.source}</span>
                    )}
                    <span>· {formatDate(item.postedDate, locale)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>{t('resell.noListings')}</div>
        )}
      </div>
    </div>
  );
}
