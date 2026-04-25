import * as styles from '../App.module.css';

const TabNav = ({ activeTab, onChange }) => (
  <div className={styles.tabNav} role="tablist" aria-label="Converter mode">
    <button
      type="button"
      role="tab"
      aria-selected={activeTab === 'pdf'}
      className={`${styles.tabButton} ${activeTab === 'pdf' ? styles.tabButtonActive : ''}`}
      onClick={() => onChange('pdf')}
    >
      PDF Password Remover
    </button>
    <button
      type="button"
      role="tab"
      aria-selected={activeTab === 'heic'}
      className={`${styles.tabButton} ${activeTab === 'heic' ? styles.tabButtonActive : ''}`}
      onClick={() => onChange('heic')}
    >
      HEIC to PNG
    </button>
  </div>
);

export default TabNav;
