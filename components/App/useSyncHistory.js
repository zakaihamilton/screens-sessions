'use client';

import { useEffect, useState } from 'react';
import { clearHistoryAction, getSyncHistory } from '@/app/sync';

/**
 * Manages sync history fetching, refreshing, and clear-history confirmation.
 */
export function useSyncHistory({ activeTab, setLogs, setError }) {
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showClearHistoryDialog, setShowClearHistoryDialog] = useState(false);

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

  return {
    history,
    historyLoading,
    showClearHistoryDialog,
    loadHistory,
    handleClearHistory,
    confirmClearHistory,
    declineClearHistory,
  };
}
