'use client';

import { useEffect, useState } from 'react';
import ConfirmDialog from '@/components/ConfirmDialog';
import Header from '@/components/Header';
import HistoryView from '@/components/HistoryView';
import ProcessingView from '@/components/ProcessingView';
import ReviewScreen from '@/components/ReviewScreen';
import StartScreen from '@/components/StartScreen';
import styles from './App.module.css';
import { useDropboxWorkflow } from './useDropboxWorkflow';
import { useSyncHistory } from './useSyncHistory';
import { useSyncMonitor } from './useSyncMonitor';

export default function App() {
  const [view, setView] = useState('start');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState(null);
  const [theme, setTheme] = useState('light');
  const [syncType, setSyncType] = useState(null);

  useEffect(() => {
    if (
      localStorage.theme === 'dark' ||
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
    ) {
      // This browser-only preference runs after hydration to avoid a server/client theme mismatch.
      setTheme('dark');
      document.documentElement.classList.add('dark');
    }
  }, []);

  const {
    groups,
    selectedFiles,
    showFullNames,
    toggleShowFullNames,
    handleDropboxSync,
    handleMove,
    toggleSelect,
    toggleGroup,
  } = useDropboxWorkflow({ setView, setActiveTab, setLogs, setError, setSyncType });

  const {
    autoScroll,
    toggleAutoScroll,
    logsRef,
    showCancelDialog,
    handleWasabiSync,
    downloadLogs,
    handleCancelSync,
    confirmCancelSync,
    declineCancelSync,
    connectToJob,
  } = useSyncMonitor({
    view,
    syncType,
    logs,
    setView,
    setActiveTab,
    setLogs,
    setError,
    setSyncType,
  });

  const {
    history,
    historyLoading,
    showClearHistoryDialog,
    loadHistory,
    handleClearHistory,
    confirmClearHistory,
    declineClearHistory,
  } = useSyncHistory({ activeTab, setLogs, setError });

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark');
    localStorage.theme = newTheme;
  };

  const handleTabChange = (tab) => {
    if (tab === 'dashboard') {
      setActiveTab('dashboard');
      setView('start');
    } else {
      setActiveTab('history');
    }
  };

  const renderDashboard = () => {
    if (view === 'start') {
      return <StartScreen onDropboxSync={handleDropboxSync} onWasabiSync={handleWasabiSync} />;
    }
    if (view === 'review') {
      return (
        <ReviewScreen
          groups={groups}
          selectedFiles={selectedFiles}
          showFullNames={showFullNames}
          onToggleFullNames={toggleShowFullNames}
          onRescan={handleDropboxSync}
          onMove={handleMove}
          onToggleSelect={toggleSelect}
          onToggleGroup={toggleGroup}
        />
      );
    }
    return (
      <ProcessingView
        view={view}
        syncType={syncType}
        logs={logs}
        error={error}
        autoScroll={autoScroll}
        logsRef={logsRef}
        onDownloadLogs={downloadLogs}
        onToggleAutoScroll={toggleAutoScroll}
        onCancelSync={handleCancelSync}
        onDismissError={() => setError(null)}
      />
    );
  };

  const showGlobalError =
    error && !(activeTab === 'dashboard' && view !== 'start' && view !== 'review');

  return (
    <div className={styles.page}>
      <Header
        activeTab={activeTab}
        theme={theme}
        onTabChange={handleTabChange}
        onToggleTheme={toggleTheme}
      />

      <main className={styles.main}>
        {showGlobalError && (
          <div className={styles.errorBanner}>
            <span>{error}</span>
            <button type="button" className={styles.dismissButton} onClick={() => setError(null)}>
              Dismiss
            </button>
          </div>
        )}

        {activeTab === 'dashboard' ? (
          renderDashboard()
        ) : (
          <HistoryView
            history={history}
            historyLoading={historyLoading}
            onRefresh={loadHistory}
            onClearHistory={handleClearHistory}
            onConnect={connectToJob}
          />
        )}

        {showCancelDialog && (
          <ConfirmDialog
            title="Cancel Sync?"
            message="Are you sure you want to cancel the sync? This may interrupt the current process."
            cancelLabel="Keep Syncing"
            confirmLabel="Cancel Sync"
            onCancel={declineCancelSync}
            onConfirm={confirmCancelSync}
          />
        )}

        {showClearHistoryDialog && (
          <ConfirmDialog
            title="Clear Sync History?"
            message="This will permanently remove the sync history from the server. This action cannot be undone."
            cancelLabel="Keep History"
            confirmLabel="Clear History"
            onCancel={declineClearHistory}
            onConfirm={confirmClearHistory}
          />
        )}
      </main>
    </div>
  );
}
