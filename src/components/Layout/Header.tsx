import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useI18n, LOCALE_LABELS } from '../../i18n';
import type { Locale } from '../../types';
import styles from './Header.module.css';

export default function Header() {
  const { t, locale, setLocale } = useI18n();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { to: '/', label: t('nav.home') },
    { to: '/coupons', label: t('nav.coupons') },
    { to: '/play', label: t('nav.play') },
    { to: '/resell', label: t('nav.resell') },
    { to: '/memorial', label: t('nav.memorial') },
  ];

  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <Link to="/" className={styles.logo}>
          <img src="/logo.png" alt="Gvault" className={styles.logoImg} />
          <span>G<span className={styles.logoAccent}>vault</span></span>
        </Link>

        <nav className={styles.nav}>
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className={styles.headerRight}>
          <select
            className={styles.langSelect}
            value={locale}
            onChange={e => setLocale(e.target.value as Locale)}
            aria-label="Language"
          >
            {(Object.entries(LOCALE_LABELS) as [Locale, string][]).map(([code, label]) => (
              <option key={code} value={code}>{label}</option>
            ))}
          </select>

          <button
            className={styles.mobileMenuBtn}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menu"
          >
            {mobileOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav className={styles.mobileNav}>
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
              }
              onClick={() => setMobileOpen(false)}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      )}
    </header>
  );
}
