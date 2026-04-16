import { useParams, Link } from 'react-router-dom';
import { useI18n } from '../i18n';
import { getCharacterById } from '../utils/data';
import styles from './CharacterDetail.module.css';

export default function CharacterDetail() {
  const { slug, id } = useParams<{ slug: string; id: string }>();
  const { t, locale } = useI18n();
  const char = id ? getCharacterById(id) : undefined;

  if (!char) {
    return (
      <div className={styles.page}>
        <div className="container">
          <div className={styles.notFound}>{t('characters.notFound')}</div>
        </div>
      </div>
    );
  }

  const l = (ko: string, en?: string) => locale === 'ko' ? ko : (en || ko);

  const skillTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      active: t('characters.active'),
      passive: t('characters.passive'),
      ultimate: t('characters.ultimate'),
    };
    return map[type] || type;
  };

  const skillTypeBadge = (type: string) => {
    const map: Record<string, string> = {
      active: 'badge-primary',
      passive: 'badge-success',
      ultimate: 'badge-warning',
    };
    return map[type] || 'badge-primary';
  };

  return (
    <div className={styles.page}>
      <div className="container">
        <Link to={`/games/${slug}/characters`} className={styles.backLink}>← {t('common.back')}</Link>

        <div className={styles.header}>
          <div className={styles.thumb}>👤</div>
          <div className={styles.info}>
            <h1 className={styles.charName}>{l(char.name, char.nameEn)}</h1>
            <div className={styles.charMeta}>
              <span className={styles[`rarity${char.rarity}`]}>{char.rarity}</span>
              <span className="badge badge-primary">{l(char.element, char.elementEn)}</span>
              <span className="badge badge-secondary">{l(char.role, char.roleEn)}</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>📊 {t('characters.stats')}</h2>
          <div className={styles.statsGrid}>
            <div className={`glass-card ${styles.statItem}`}>
              <div className={styles.statLabel}>{t('characters.attack')}</div>
              <div className={styles.statValue}>{char.stats.attack.toLocaleString()}</div>
            </div>
            <div className={`glass-card ${styles.statItem}`}>
              <div className={styles.statLabel}>{t('characters.hp')}</div>
              <div className={styles.statValue}>{char.stats.hp.toLocaleString()}</div>
            </div>
            <div className={`glass-card ${styles.statItem}`}>
              <div className={styles.statLabel}>{t('characters.defense')}</div>
              <div className={styles.statValue}>{char.stats.defense.toLocaleString()}</div>
            </div>
            <div className={`glass-card ${styles.statItem}`}>
              <div className={styles.statLabel}>{t('characters.speed')}</div>
              <div className={styles.statValue}>{char.stats.speed}</div>
            </div>
            <div className={`glass-card ${styles.statItem}`}>
              <div className={styles.statLabel}>{t('characters.critRate')}</div>
              <div className={styles.statPercent}>{char.stats.critRate}%</div>
            </div>
            <div className={`glass-card ${styles.statItem}`}>
              <div className={styles.statLabel}>{t('characters.critDamage')}</div>
              <div className={styles.statPercent}>{char.stats.critDamage}%</div>
            </div>
          </div>
        </section>

        {/* Skills */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>⚔️ {t('characters.skills')}</h2>
          <div className={styles.skillList}>
            {char.skills.map((skill, i) => (
              <div key={i} className={`glass-card ${styles.skillItem}`}>
                <div className={styles.skillHeader}>
                  <span className={styles.skillName}>{l(skill.name, skill.nameEn)}</span>
                  <span className={`badge ${skillTypeBadge(skill.type)}`}>{skillTypeLabel(skill.type)}</span>
                </div>
                <p className={styles.skillDesc}>{l(skill.description, skill.descriptionEn)}</p>
                {skill.cooldown && (
                  <div className={styles.skillCooldown}>
                    {t('characters.cooldown')}: {skill.cooldown} turns
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Recommended Decks */}
        {char.recommendedDecks.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>🃏 {t('characters.decks')}</h2>
            <div className={styles.deckList}>
              {char.recommendedDecks.map((deck, i) => (
                <div key={i} className={`glass-card ${styles.deckItem}`}>
                  <div className={styles.deckName}>{l(deck.deckName, deck.deckNameEn)}</div>
                  <p className={styles.deckDesc}>{l(deck.description, deck.descriptionEn)}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Recommended Gear */}
        {char.recommendedGear.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>🛡️ {t('characters.gear')}</h2>
            <div className={styles.gearList}>
              {char.recommendedGear.map((gear, i) => (
                <div key={i} className={`glass-card ${styles.gearItem}`}>
                  <div className={styles.gearName}>{l(gear.setName, gear.setNameEn)}</div>
                  <div className={styles.gearOptions}>{l(gear.options, gear.optionsEn)}</div>
                  <p className={styles.gearReason}>{l(gear.reason, gear.reasonEn)}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
