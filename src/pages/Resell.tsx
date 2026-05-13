import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useI18n } from '../i18n';
import { useGames } from '../hooks/useApi';
import styles from './Resell.module.css';

// Resell data is still empty — will be populated later

export default function Resell() {
  const { gameSlug } = useParams<{ gameSlug?: string }>();
  const { t } = useI18n();
  const [gameFilter, setGameFilter] = useState<string>(gameSlug || 'all');
  const { games, loading } = useGames();

  // Resell listings will be loaded from API when the feature is built
  const listings: never[] = [];

  if (loading) {
    return (
      <div className={styles.page}>
        <div className="container">
          <div className={styles.emptyState}>Loading...</div>
        </div>
      </div>
    );
  }

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
                  {g.nameEn}
                </option>
              ))}
            </select>
          </div>
        )}

        {listings.length > 0 ? (
          <div className={styles.grid}>
            {/* Resell listings will render here when data is available */}
          </div>
        ) : (
          <div className={styles.emptyState}>{t('resell.noListings')}</div>
        )}
      </div>
    </div>
  );
}
