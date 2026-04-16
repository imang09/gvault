import { Link } from 'react-router-dom';
import { useI18n } from '../../i18n';
import styles from './Footer.module.css';

export default function Footer() {
  const { t } = useI18n();

  return (
    <footer className={styles.footer}>
      <div className={styles.footerInner}>
        <div className={styles.footerBrand}>
          <div className={styles.footerLogo}>
            <img src="/logo.png" alt="Gvault" style={{ width: 28, height: 28, borderRadius: 4 }} />
            {' '}G<span className={styles.footerLogoAccent}>vault</span>
          </div>
          <p className={styles.footerDesc}>
            {t('footer.description')}
          </p>
        </div>

        <div className={styles.footerCol}>
          <h4>{t('footer.links')}</h4>
          <Link to="/coupons">{t('nav.coupons')}</Link>
          <Link to="/play">{t('nav.play')}</Link>
          <Link to="/resell">{t('nav.resell')}</Link>
          <Link to="/memorial">{t('nav.memorial')}</Link>
        </div>

        <div className={styles.footerCol}>
          <h4>{t('footer.legal')}</h4>
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
          <a href="#">Contact</a>
        </div>
      </div>

      <div className={styles.footerBottom}>
        <span>{t('footer.copyright')}</span>
        <span>{t('footer.disclaimer')}</span>
      </div>
    </footer>
  );
}
