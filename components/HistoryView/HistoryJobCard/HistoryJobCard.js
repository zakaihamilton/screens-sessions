import styles from './HistoryJobCard.module.css';

function statusClass(status) {
  if (status === 'COMPLETED') return styles.statusCompleted;
  if (status === 'FAILED') return styles.statusFailed;
  return styles.statusRunning;
}

export default function HistoryJobCard({ job, onConnect }) {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.left}>
          <span className={`${styles.status} ${statusClass(job.status)}`}>{job.status}</span>
          <span className={styles.jobId}>Job #{job.id}</span>
        </div>
        <div className={styles.right}>
          {job.status === 'RUNNING' && (
            <button
              type="button"
              className={styles.connectButton}
              onClick={() => onConnect(job.id, job.status)}
            >
              Connect
            </button>
          )}
          <span className={styles.timestamp}>{new Date(job.start_time).toLocaleString()}</span>
        </div>
      </div>
      <div className={styles.logPreview}>{job.logs.split('\n').slice(-2).join('\n')}</div>
    </div>
  );
}
