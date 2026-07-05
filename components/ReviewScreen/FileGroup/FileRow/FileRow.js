import {
  AlertCircle,
  AlertTriangle,
  CheckSquare,
  ChevronRight,
  FileAudio,
  Square,
} from 'lucide-react';
import styles from './FileRow.module.css';

export default function FileRow({ file, isSelected, showFullNames, onToggleSelect }) {
  const rowClass = [
    styles.row,
    file.isValid ? styles.rowValid : styles.rowInvalid,
    isSelected ? styles.rowSelected : '',
  ]
    .filter(Boolean)
    .join(' ');

  const nameClass = [
    styles.fileName,
    file.isValid ? styles.fileNameValid : styles.fileNameInvalid,
    showFullNames ? styles.fileNameFull : styles.fileNameTruncate,
  ].join(' ');

  return (
    <div className={rowClass} onClick={() => onToggleSelect(file.id, file.isValid)}>
      <div className={styles.checkbox}>
        {file.isValid ? (
          isSelected ? (
            <div className={styles.checkboxSelected}>
              <CheckSquare className={styles.checkboxIcon} />
            </div>
          ) : (
            <Square className={styles.checkboxEmpty} />
          )
        ) : (
          <AlertCircle className={styles.invalidIcon} />
        )}
      </div>

      <div className={styles.content}>
        <div className={styles.nameRow}>
          <FileAudio
            className={`${styles.fileIcon} ${file.isValid ? styles.fileIconValid : styles.fileIconInvalid}`}
          />
          <span className={nameClass}>{file.name}</span>

          {!file.isValid && (
            <span className={styles.errorBadge}>
              <AlertCircle className={styles.badgeIcon} />
              {file.validationError}
            </span>
          )}

          {file.isValid && file.spellingWarning && (
            <div
              className={`${styles.warningBadge} ${styles.warningBadgeSpelling}`}
              title={file.spellingWarning}
            >
              <AlertTriangle className={styles.badgeIcon} />
              <span>{file.spellingWarning}</span>
            </div>
          )}

          {file.isValid && file.privacyWarning && (
            <div
              className={`${styles.warningBadge} ${styles.warningBadgePrivacy}`}
              title={file.privacyWarning}
            >
              <AlertTriangle className={styles.badgeIcon} />
              <span>{file.privacyWarning}</span>
            </div>
          )}

          {file.isValid && file.hebrewPunctuationWarning && (
            <div
              className={`${styles.warningBadge} ${styles.warningBadgeHebrew}`}
              title={file.hebrewPunctuationWarning}
            >
              <AlertTriangle className={styles.badgeIcon} />
              <span>{file.hebrewPunctuationWarning}</span>
            </div>
          )}
        </div>

        <div className={styles.pathRow}>
          <div className={styles.pathSrc}>
            <span className={styles.pathLabel}>src:</span>
            <span className={styles.pathText}>.../{file.group}</span>
          </div>
          {file.isValid && (
            <>
              <ChevronRight className={styles.pathArrow} />
              <div className={styles.pathDest}>
                <span className={styles.pathLabel}>dest:</span>
                <span className={`${styles.pathText} ${styles.pathDestText}`}>{file.destPath}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
