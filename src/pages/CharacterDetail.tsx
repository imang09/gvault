import { useParams, Link } from 'react-router-dom';
import { useI18n } from '../i18n';
import styles from './CharacterDetail.module.css';

// Characters data is still empty — will be populated via API later

export default function CharacterDetail() {
  const { slug } = useParams<{ slug: string; id: string }>();
  const { t } = useI18n();

  // Character will be loaded from API when the feature is built
  return (
    <div className={styles.page}>
      <div className="container">
        <Link to={`/games/${slug}/characters`} className={styles.backLink}>← {t('common.back')}</Link>
        <div className={styles.notFound}>{t('characters.notFound')}</div>
      </div>
    </div>
  );
}
