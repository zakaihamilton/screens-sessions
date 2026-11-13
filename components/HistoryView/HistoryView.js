import { Clock, History, Loader2, RefreshCw, Trash2 } from 'lucide-react';
import HistoryJobCard from './HistoryJobCard';
import styles from './HistoryView.module.css';

export default function HistoryView({
  history,
  historyLoading,
  onRefresh,
  onClearHistory,
  onConnect,
}) {
  return (
    <div className={`${styles.container} fadeIn`}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          <History className={styles.titleIcon} />
          Sync History
        </h2>
        <div className={styles.actions}>
          <button type="button" className={styles.refreshButton} onClick={onRefresh}>
            <RefreshCw className={styles.actionIcon} />
            <span>Refresh</span>
          </button>
          <button type="button" className={styles.clearButton} onClick={onClearHistory}>
            <Trash2 className={styles.actionIcon} />
            <span>Clear History</span>
          </button>
        </div>
      </div>

      <div className={styles.list}>
        {historyLoading ? (
          <div className={styles.loadingState}>
            <Loader2 className={`${styles.loadingIcon} spin`} />
            <p className={styles.stateText}>Loading sync history...</p>
          </div>
        ) : history.length === 0 ? (
          <div className={styles.emptyState}>
            <Clock className={styles.emptyIcon} />
            <p className={styles.stateText}>No sync history found.</p>
          </div>
        ) : (
          history.map((job) => <HistoryJobCard key={job.id} job={job} onConnect={onConnect} />)
        )}
      </div>
    </div>
  );
}
