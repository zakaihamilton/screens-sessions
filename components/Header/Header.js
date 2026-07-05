import { FolderOpen, History, LayoutDashboard, Moon, Sun } from 'lucide-react';
import styles from './Header.module.css';

export default function Header({ activeTab, theme, onTabChange, onToggleTheme }) {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.left}>
          <div className={styles.brand}>
            <div className={styles.logo}>
              <FolderOpen className={styles.logoIcon} />
            </div>
            <h1 className={styles.title}>Session Sync</h1>
          </div>
          <nav className={styles.nav}>
            <button
              type="button"
              className={`${styles.navButton} ${activeTab === 'dashboard' ? styles.navButtonActive : ''}`}
              onClick={() => onTabChange('dashboard')}
            >
              <LayoutDashboard className={styles.navIcon} />
              Dashboard
            </button>
            <button
              type="button"
              className={`${styles.navButton} ${activeTab === 'history' ? styles.navButtonActive : ''}`}
              onClick={() => onTabChange('history')}
            >
              <History className={styles.navIcon} />
              History
            </button>
          </nav>
        </div>
        <button type="button" className={styles.themeButton} onClick={onToggleTheme}>
          {theme === 'light' ? (
            <Moon className={styles.themeIcon} />
          ) : (
            <Sun className={styles.themeIcon} />
          )}
        </button>
      </div>
    </header>
  );
}
