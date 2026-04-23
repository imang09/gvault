import { useParams, Link } from 'react-router-dom';
import { useI18n } from '../i18n';
import { getCharactersByGame, getGameBySlug } from '../utils/data';
import styles from './Characters.module.css';

export default function Characters() {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useI18n();
  const game = slug ? getGameBySlug(slug) : undefined;
  const characters = slug ? getCharactersByGame(slug) : [];

  return (
    <div className={styles.page}>
      <div className="container">
        <Link to={`/games/${slug}`} className={styles.backLink}>← {t('common.back')}</Link>
        <h1 className={styles.pageTitle}>
          {game ? (game.nameEn) : ''} — {t('characters.title')}
        </h1>

        {characters.length > 0 ? (
          <div className={styles.grid}>
            {characters.map(char => (
              <Link
                key={char.id}
                to={`/games/${slug}/characters/${char.id}`}
                className={`glass-card ${styles.card} fade-in`}
              >
                <div className={styles.cardThumb}>👤</div>
                <div className={styles.cardBody}>
                  <div className={styles.cardName}>
                    {char.nameEn || char.name}
                  </div>
                  <div className={styles.cardMeta}>
                    <span className={styles[`rarity${char.rarity}`]}>{char.rarity}</span>
                    <span className="badge badge-primary">
                      {char.elementEn || char.element}
                    </span>
                    <span className={styles.cardRole}>
                      {char.roleEn || char.role}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>{t('characters.notFound')}</div>
        )}
      </div>
    </div>
  );
}
