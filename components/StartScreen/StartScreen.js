import { Folder, MoveRight } from 'lucide-react';
import styles from './StartScreen.module.css';

export default function StartScreen({ onDropboxSync, onWasabiSync }) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <h2 className={styles.heading}>System Concepts</h2>
        <h4 className={styles.subheading}>Session Sync</h4>
        <p className={styles.description}>Update System Concepts Sessions</p>
        <div className={styles.grid}>
          <div className={styles.step}>
            <h3 className={styles.stepTitle}>Step 1: Organize Dropbox</h3>
            <button type="button" className={styles.scanButton} onClick={onDropboxSync}>
              <Folder className={styles.buttonIcon} />
              Scan
            </button>
          </div>
          <div className={styles.step}>
            <h3 className={styles.stepTitle}>Step 2: Upload to Wasabi</h3>
            <button type="button" className={styles.uploadButton} onClick={onWasabiSync}>
              <MoveRight className={styles.buttonIcon} />
              Upload
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
