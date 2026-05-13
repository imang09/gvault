import { useParams, Link } from 'react-router-dom';
import { useI18n } from '../i18n';
import { useGame } from '../hooks/useApi';
import styles from './Characters.module.css';

// Characters data is still empty — will be populated later
// For now, this page just shows the game name and empty state

export default function Characters() {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useI18n();
  const { game, loading } = useGame(slug);

  // Characters will be loaded from API when the feature is built
  const characters: never[] = [];

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
        <Link to={`/games/${slug}`} className={styles.backLink}>← {t('common.back')}</Link>
        <h1 className={styles.pageTitle}>
          {game ? (game.nameEn) : ''} — {t('characters.title')}
        </h1>

        {characters.length > 0 ? (
          <div className={styles.grid}>
            {/* Characters will render here when data is available */}
          </div>
        ) : (
          <div className={styles.emptyState}>{t('characters.notFound')}</div>
        )}
      </div>
    </div>
  );
}
