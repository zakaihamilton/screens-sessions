import { CheckSquare, Folder, Square } from 'lucide-react';
import styles from './FileGroup.module.css';
import FileRow from './FileRow';

export default function FileGroup({
  groupName,
  files,
  selectedFiles,
  showFullNames,
  onToggleGroup,
  onToggleSelect,
}) {
  const validFiles = files.filter((f) => f.isValid);
  const groupIds = validFiles.map((f) => f.id);
  const allSelected = validFiles.length > 0 && groupIds.every((id) => selectedFiles.has(id));
  const someSelected = validFiles.length > 0 && groupIds.some((id) => selectedFiles.has(id));

  return (
    <div className={styles.card}>
      <div className={styles.header} onClick={() => onToggleGroup(groupName, files)}>
        <div className={styles.checkboxArea}>
          {validFiles.length > 0 ? (
            allSelected ? (
              <div className={styles.checkboxSelected}>
                <CheckSquare className={styles.checkboxIcon} />
              </div>
            ) : someSelected ? (
              <div className={styles.checkboxPartial}>
                <div className={styles.partialBar} />
              </div>
            ) : (
              <Square className={styles.checkboxEmpty} />
            )
          ) : (
            <Square className={styles.checkboxDisabled} />
          )}
        </div>

        <div className={styles.groupInfo}>
          <div className={styles.folderIcon}>
            <Folder className={styles.folderIconSvg} />
          </div>
          <span className={styles.groupName}>{groupName}</span>
        </div>

        <span className={styles.itemCount}>{files.length} items</span>
      </div>

      <div className={styles.fileList}>
        {files.map((file) => (
          <FileRow
            key={file.id}
            file={file}
            isSelected={selectedFiles.has(file.id)}
            showFullNames={showFullNames}
            onToggleSelect={onToggleSelect}
          />
        ))}
      </div>
    </div>
  );
}
