import * as styles from './LoadingSpinner.module.css';
import { useProcessing } from '../context/ProcessingContext';

export default function LoadingSpinner() {
  const { isProcessing } = useProcessing();

  if (!isProcessing) return null;

  return (
    <div className={styles.overlay} aria-label="Processing, please wait" role="status">
      <div className={styles.spinner} aria-hidden="true" />
    </div>
  );
}
