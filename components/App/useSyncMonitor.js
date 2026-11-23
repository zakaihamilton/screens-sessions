'use client';

import { useEffect, useRef, useState } from 'react';
import { cancelSyncAction, getSyncStatus, startFullSyncProcess } from '@/app/sync';

function formatLogLine(line) {
  return {
    msg: line,
    type: line.includes('ERROR') ? 'error' : line.includes('🚀') ? 'success' : 'info',
    time: new Date().toLocaleTimeString(),
  };
}

/**
 * Manages Wasabi sync execution, live status polling, log auto-scroll, download, and cancellation.
 */
export function useSyncMonitor({
  view,
  syncType,
  logs,
  setView,
  setActiveTab,
  setLogs,
  setError,
  setSyncType,
}) {
  const [connectedJobId, setConnectedJobId] = useState(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const logsRef = useRef(null);
  const prevLogsSnapshotRef = useRef('');

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
              return [...prev, ...newLines.map(formatLogLine)];
            });
          } else {
            setLogs(lines.map(formatLogLine));
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
  }, [view, connectedJobId, syncType, setLogs, setView, setError]);

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

  const declineCancelSync = () => {
    setShowCancelDialog(false);
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

  const toggleAutoScroll = () => setAutoScroll((prev) => !prev);

  return {
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
  };
}
