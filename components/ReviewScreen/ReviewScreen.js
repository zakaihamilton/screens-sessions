import { FolderOpen, MoveRight, RefreshCw, WrapText } from 'lucide-react';
import FileGroup from './FileGroup';
import styles from './ReviewScreen.module.css';

export default function ReviewScreen({
  groups,
  selectedFiles,
  showFullNames,
  onToggleFullNames,
  onRescan,
  onMove,
  onToggleSelect,
  onToggleGroup,
}) {
  const groupKeys = Object.keys(groups).sort((a, b) => a.localeCompare(b));
  const totalFiles = groupKeys.reduce((acc, key) => acc + groups[key].length, 0);

  return (
    <div className={`${styles.container} fadeIn`}>
      <div className={styles.stickyHeader}>
        <div className={styles.headerContent}>
          <div className={styles.titleSection}>
            <h2>
              Review Files
              <span className={styles.badge}>{totalFiles} found</span>
            </h2>
            <p className={styles.subtitle}>
              Select the files you want to move to your organized folders.
            </p>
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              className={`${styles.toggleButton} ${showFullNames ? styles.toggleButtonActive : ''}`}
              onClick={onToggleFullNames}
            >
              <WrapText className={styles.buttonIcon} />
              <span>{showFullNames ? 'Collapse Names' : 'Full Names'}</span>
            </button>

            <button type="button" className={styles.secondaryButton} onClick={onRescan}>
              <RefreshCw className={styles.buttonIcon} />
              Rescan
            </button>

            <button
              type="button"
              className={styles.primaryButton}
              onClick={onMove}
              disabled={selectedFiles.size === 0}
            >
              <MoveRight className={styles.buttonIcon} />
              <span>Move {selectedFiles.size} Files</span>
            </button>
          </div>
        </div>
      </div>

      {groupKeys.length === 0 ? (
        <div className={styles.emptyState}>
          <FolderOpen className={styles.emptyIcon} />
          <p>
            No files found in <code>/shared_sessions</code>
          </p>
        </div>
      ) : (
        <div className={styles.groups}>
          {groupKeys.map((gName) => (
            <FileGroup
              key={gName}
              groupName={gName}
              files={groups[gName]}
              selectedFiles={selectedFiles}
              showFullNames={showFullNames}
              onToggleGroup={onToggleGroup}
              onToggleSelect={onToggleSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}
