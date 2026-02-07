import * as styles from '../App.module.css';
import { useProcessing } from '../hooks/useProcessing';

const TabNav = ({ activeTab, onChange }) => {
  const { isProcessing } = useProcessing();

  const handleChange = (tab) => {
    if (!isProcessing) {
      onChange(tab);
    }
  };

  return (
    <div className={styles.tabNav}>
      <button
        className={`${styles.tabButton} ${activeTab === 'pdf' ? styles.tabButtonActive : ''}`}
        onClick={() => handleChange('pdf')}
        disabled={isProcessing}
      >
        PDF Password Remover
      </button>
      <button
        className={`${styles.tabButton} ${activeTab === 'heic' ? styles.tabButtonActive : ''}`}
        onClick={() => handleChange('heic')}
        disabled={isProcessing}
      >
        HEIC to PNG
      </button>
    </div>
  );
};

export default TabNav;
