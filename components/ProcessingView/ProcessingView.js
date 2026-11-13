import {
  AlertCircle,
  CheckCircle2,
  CheckSquare,
  ExternalLink,
  Loader2,
  Square,
  X,
} from 'lucide-react';
import styles from './ProcessingView.module.css';

export default function ProcessingView({
  view,
  syncType,
  logs,
  error,
  autoScroll,
  logsRef,
  onDownloadLogs,
  onToggleAutoScroll,
  onCancelSync,
  onDismissError,
}) {
  const syncTitle =
    syncType === 'dropbox'
      ? '📁 Syncing Dropbox'
      : syncType === 'wasabi'
        ? '☁️ Syncing to Wasabi'
        : '🔄 Running Full Pipeline';

  return (
    <div className={styles.container}>
      <div className={styles.statusIcon}>
        {view === 'done' ? (
          <CheckCircle2 className={styles.doneIcon} />
        ) : (
          <Loader2 className={`${styles.loadingIcon} spin`} />
        )}
      </div>

      <div className={styles.title}>{syncTitle}</div>

      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <button type="button" className={styles.linkButton} onClick={onDownloadLogs}>
            <ExternalLink className={styles.toolbarIcon} />
            Download Logs
          </button>
          <button type="button" className={styles.toggleButton} onClick={onToggleAutoScroll}>
            {autoScroll ? (
              <CheckSquare className={styles.toggleIconActive} />
            ) : (
              <Square className={styles.toggleIcon} />
            )}
            <span>Auto-scroll</span>
          </button>
        </div>
        {view !== 'done' && (
          <button type="button" className={styles.cancelButton} onClick={onCancelSync}>
            <X className={styles.cancelIcon} />
            <span>Cancel Sync</span>
          </button>
        )}
      </div>

      {error && (
        <div className={styles.errorBanner}>
          <div className={styles.errorContent}>
            <div className={styles.errorMessage}>
              <AlertCircle className={styles.errorIcon} />
              <div>{error}</div>
            </div>
            <button type="button" className={styles.dismissButton} onClick={onDismissError}>
              Dismiss
            </button>
          </div>
        </div>
      )}

      <div ref={logsRef} className={styles.logs}>
        {logs.map((l) => (
          <div key={`${l.time}|${l.msg}|${l.type}`} className={styles.logLine}>
            [{l.time}] $ {l.msg}
          </div>
        ))}
      </div>
    </div>
  );
}
