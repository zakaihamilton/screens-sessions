'use client';

import { useEffect, useRef, useState } from 'react';
import { moveFilesServer, scanDropboxServer } from '@/app/dropbox';
import {
  cancelSyncAction,
  clearHistoryAction,
  getSyncHistory,
  getSyncStatus,
  startFullSyncProcess,
} from '@/app/sync';
import ConfirmDialog from '@/components/ConfirmDialog';
import Header from '@/components/Header';
import HistoryView from '@/components/HistoryView';
import ProcessingView from '@/components/ProcessingView';
import ReviewScreen from '@/components/ReviewScreen';
import StartScreen from '@/components/StartScreen';
import styles from './App.module.css';

export default function App() {
  const [view, setView] = useState('start');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [logs, setLogs] = useState([]);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState(null);
  const [theme, setTheme] = useState('light');
  const [connectedJobId, setConnectedJobId] = useState(null);
  const [syncType, setSyncType] = useState(null);
  const [groups, setGroups] = useState({});
  const [selectedFiles, setSelectedFiles] = useState(new Set());
  const [showFullNames, setShowFullNames] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showClearHistoryDialog, setShowClearHistoryDialog] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const logsRef = useRef(null);
  const prevLogsSnapshotRef = useRef('');

  useEffect(() => {
    if (
      localStorage.theme === 'dark' ||
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
    ) {
      setTheme('dark');
      document.documentElement.classList.add('dark');
    }
  }, []);

  useEffect(() => {
    if (activeTab !== 'history') return;

    let cancelled = false;

    (async () => {
      setHistoryLoading(true);
      const data = await getSyncHistory();
      if (!cancelled) {
        setHistory(data);
        setHistoryLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      setHistoryLoading(false);
    };
  }, [activeTab]);

  const loadHistory = async () => {
    setHistoryLoading(true);
    const data = await getSyncHistory();
    setHistory(data);
    setHistoryLoading(false);
  };

  const handleClearHistory = () => {
    setShowClearHistoryDialog(true);
  };

  const confirmClearHistory = async () => {
    setShowClearHistoryDialog(false);
    setHistoryLoading(true);
    try {
      const res = await clearHistoryAction();
      if (res && (res.status === 'success' || res.status === 'ok')) {
        setHistory([]);
        setLogs((prev) => [
          ...prev,
          { msg: '🧹 Sync history cleared', type: 'info', time: new Date().toLocaleTimeString() },
        ]);
      } else {
        setError(res.message || 'Failed to clear history');
      }
    } catch (err) {
      setError(`Error clearing history: ${err.message}`);
    } finally {
      setHistoryLoading(false);
    }
  };

  const declineClearHistory = () => {
    setShowClearHistoryDialog(false);
  };

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

  const handleDropboxSync = async () => {
    setView('processing');
    setActiveTab('dashboard');
    setLogs([]);
    setError(null);
    setSyncType('dropbox');

    const addLog = (msg, type = 'info') => {
      setLogs((prev) => [...prev, { msg, type, time: new Date().toLocaleTimeString() }]);
    };

    try {
      addLog('>>> Starting Dropbox Scan...', 'info');
      const scanRes = await scanDropboxServer();

      if (!scanRes.success) throw new Error(`Scan failed: ${scanRes.error}`);
      addLog('✅ Dropbox Scan completed successfully', 'success');

      const foundGroups = scanRes.data;
      setGroups(foundGroups);

      const totalFiles = Object.values(foundGroups).flat().length;
      addLog(`Found ${totalFiles} files in ${Object.keys(foundGroups).length} groups`, 'info');

      const allIds = new Set();
      Object.values(foundGroups)
        .flat()
        .forEach((f) => {
          if (
            f.isValid &&
            !f.spellingWarning &&
            !f.isOld &&
            !f.privacyWarning &&
            !f.hebrewPunctuationWarning
          ) {
            allIds.add(f.id);
          }
        });
      setSelectedFiles(allIds);

      setView('review');
    } catch (err) {
      addLog(`❌ ERROR: ${err.message}`, 'error');
      setError(err.message);
      setView('start');
    }
  };

  const handleMove = async () => {
    setView('processing');

    const addLog = (msg, type = 'info') => {
      setLogs((prev) => [...prev, { msg, type, time: new Date().toLocaleTimeString() }]);
    };

    const filesToMove = Object.values(groups)
      .flat()
      .filter((f) => selectedFiles.has(f.id));

    if (filesToMove.length === 0) {
      addLog('No files selected to move', 'info');
      setView('review');
      return;
    }

    addLog(`Instructing server to move ${filesToMove.length} files...`, 'info');

    try {
      const response = await moveFilesServer(filesToMove);

      if (!response.success) {
        throw new Error(response.error);
      }

      addLog('✅ Server reported success.', 'success');
      addLog('🚀 Dropbox sync completed!', 'success');
      setView('done');
    } catch (err) {
      addLog(`❌ Move Failed: ${err.message}`, 'error');
      setError(err.message);
      setView('review');
    }
  };

  const toggleSelect = (id, isValid) => {
    if (!isValid) return;
    const next = new Set(selectedFiles);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedFiles(next);
  };

  const toggleGroup = (_groupName, files) => {
    const validFiles = files.filter((f) => f.isValid);
    if (validFiles.length === 0) return;

    const next = new Set(selectedFiles);
    const groupIds = validFiles.map((f) => f.id);
    const allSelected = groupIds.every((id) => next.has(id));
    if (allSelected) {
      for (const id of groupIds) next.delete(id);
    } else {
      for (const id of groupIds) next.add(id);
    }
    setSelectedFiles(next);
  };

  const handleWasabiSync = async () => {
    setView('processing');
    setActiveTab('dashboard');
    setLogs([]);
    setError(null);
    setSyncType('wasabi');

    try {
      const res = await startFullSyncProcess();
      if (res.status === 'error') throw new Error(res.message);
    } catch (err) {
      setError(err.message);
      setView('start');
    }
  };

  useEffect(() => {
    let interval;
    if ((view === 'processing' && syncType === 'wasabi') || connectedJobId) {
      interval = setInterval(async () => {
        const data = await getSyncStatus();
        if (data.logs) {
          const lines = data.logs.split('\n').filter((l) => l.trim() !== '');
          if (syncType === null) {
            setLogs((prev) => {
              const existingMsgs = new Set(prev.map((l) => l.msg));
              const newLines = lines.filter((l) => !existingMsgs.has(l));
              return [
                ...prev,
                ...newLines.map((l) => ({
                  msg: l,
                  type: l.includes('ERROR') ? 'error' : l.includes('🚀') ? 'success' : 'info',
                  time: new Date().toLocaleTimeString(),
                })),
              ];
            });
          } else {
            setLogs(
              lines.map((l) => ({
                msg: l,
                type: l.includes('ERROR') ? 'error' : l.includes('🚀') ? 'success' : 'info',
                time: new Date().toLocaleTimeString(),
              })),
            );
          }
        }
        if (data.status === 'COMPLETED') {
          if (view === 'processing') {
            setView('done');
          }
          setConnectedJobId(null);
          clearInterval(interval);
        } else if (data.status === 'FAILED') {
          const errMsg = data.error || 'Sync failed.';
          setError(errMsg);
          setLogs((prev) => [
            ...prev,
            { msg: `❌ ${errMsg}`, type: 'error', time: new Date().toLocaleTimeString() },
          ]);
          setConnectedJobId(null);
          clearInterval(interval);
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [view, connectedJobId, syncType]);

  useEffect(() => {
    if (!logsRef.current) {
      prevLogsSnapshotRef.current = JSON.stringify(logs);
      return;
    }

    if (view !== 'processing') {
      prevLogsSnapshotRef.current = JSON.stringify(logs);
      return;
    }

    const snapshot = logs.map((l) => `${l.time}|${l.msg}`).join('\n');
    if (snapshot === prevLogsSnapshotRef.current) return;

    if (autoScroll) {
      logsRef.current.scrollTop = logsRef.current.scrollHeight;
    }
    prevLogsSnapshotRef.current = snapshot;
  }, [logs, view, autoScroll]);

  useEffect(() => {
    if (autoScroll && logsRef.current) {
      logsRef.current.scrollTop = logsRef.current.scrollHeight;
    }
  }, [autoScroll]);

  const downloadLogs = () => {
    const logsText = logs.map((l) => `[${l.time}] $ ${l.msg}`).join('\n');
    const element = document.createElement('a');
    element.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(logsText)}`);
    element.setAttribute('download', `sync-logs-${new Date().toISOString().split('T')[0]}.txt`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleCancelSync = () => {
    setShowCancelDialog(true);
  };

  const confirmCancelSync = async () => {
    setShowCancelDialog(false);
    try {
      const result = await cancelSyncAction();
      if (result.status === 'success' || result.status === 'cancelled') {
        setLogs((prev) => [
          ...prev,
          {
            msg: '❌ Sync cancelled by user',
            type: 'error',
            time: new Date().toLocaleTimeString(),
          },
        ]);
        setView('start');
      } else {
        setError(result.message || 'Failed to cancel sync');
      }
    } catch (err) {
      setError(`Error cancelling sync: ${err.message}`);
    }
  };

  const connectToJob = (jobId, jobStatus) => {
    if (jobStatus === 'RUNNING') {
      setConnectedJobId(jobId);
      setSyncType('wasabi');
      setActiveTab('dashboard');
      setView('processing');
      setLogs([]);
      setError(null);
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
          onToggleFullNames={() => setShowFullNames(!showFullNames)}
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
        onToggleAutoScroll={() => setAutoScroll(!autoScroll)}
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
            onCancel={() => setShowCancelDialog(false)}
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
