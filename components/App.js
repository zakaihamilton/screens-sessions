'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Folder,
  FileAudio,
  MoveRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FolderOpen,
  Terminal,
  Sun,
  Moon,
  History,
  LayoutDashboard,
  Clock,
  ExternalLink,
  CheckSquare,
  Square,
  RefreshCw,
  ChevronRight,
  AlertTriangle,
  WrapText
} from 'lucide-react';
import { X } from 'lucide-react';
import { Trash2 } from 'lucide-react';

import { startFullSyncProcess, getSyncStatus, getSyncHistory, cancelSyncAction, clearHistoryAction } from '../app/sync';
import { scanDropboxServer, moveFilesServer } from '../app/dropbox';

export default function App() {
  const [view, setView] = useState('start');
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' or 'history'
  const [logs, setLogs] = useState([]);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState(null);
  const [theme, setTheme] = useState('light');
  const [connectedJobId, setConnectedJobId] = useState(null);
  const [syncType, setSyncType] = useState(null); // 'dropbox' or 'wasabi'
  const [groups, setGroups] = useState({});
  const [selectedFiles, setSelectedFiles] = useState(new Set());
  const [showFullNames, setShowFullNames] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showClearHistoryDialog, setShowClearHistoryDialog] = useState(false);
  const logsRef = useRef(null);
  const prevLogsSnapshotRef = useRef('');

  useEffect(() => {
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setTheme('dark');
      document.documentElement.classList.add('dark');
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'history') {
      loadHistory();
    }
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
        setLogs(prev => [...prev, { msg: '🧹 Sync history cleared', type: 'info', time: new Date().toLocaleTimeString() }]);
      } else {
        setError(res.message || 'Failed to clear history');
      }
    } catch (err) {
      setError('Error clearing history: ' + err.message);
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

  const handleDropboxSync = async () => {
    setView('processing');
    setActiveTab('dashboard');
    setLogs([]);
    setError(null);
    setSyncType('dropbox');

    const addLog = (msg, type = 'info') => {
      setLogs(prev => [...prev, {
        msg,
        type,
        time: new Date().toLocaleTimeString()
      }]);
    };

    try {
      // Import and call Dropbox-specific sync
      addLog('>>> Starting Dropbox Scan...', 'info');
      const scanRes = await scanDropboxServer();

      if (!scanRes.success) throw new Error(`Scan failed: ${scanRes.error}`);
      addLog('✅ Dropbox Scan completed successfully', 'success');

      const foundGroups = scanRes.data;
      setGroups(foundGroups);

      const totalFiles = Object.values(foundGroups).flat().length;
      addLog(`Found ${totalFiles} files in ${Object.keys(foundGroups).length} groups`, 'info');

      // Auto-select all valid files
      const allIds = new Set();
      Object.values(foundGroups).flat().forEach(f => {
        if (f.isValid && !f.spellingWarning && !f.isOld) {
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
      setLogs(prev => [...prev, {
        msg,
        type,
        time: new Date().toLocaleTimeString()
      }]);
    };

    const filesToMove = Object.values(groups)
      .flat()
      .filter(f => selectedFiles.has(f.id));

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
      setView('review'); // Go back to review on failure
    }
  };

  const toggleSelect = (id, isValid) => {
    if (!isValid) return;
    const next = new Set(selectedFiles);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedFiles(next);
  };

  const toggleGroup = (groupName, files) => {
    const validFiles = files.filter(f => f.isValid);
    if (validFiles.length === 0) return;

    const next = new Set(selectedFiles);
    const groupIds = validFiles.map(f => f.id);
    const allSelected = groupIds.every(id => next.has(id));
    if (allSelected) groupIds.forEach(id => next.delete(id));
    else groupIds.forEach(id => next.add(id));
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
      if (res.status === "error" || res.message) throw new Error(res.message);
    } catch (err) {
      setError(err.message);
      setView('start');
    }
  };

  useEffect(() => {
    let interval;
    // Only poll for Wasabi sync or connected jobs, not for Dropbox sync
    if ((view === 'processing' && syncType === 'wasabi') || connectedJobId) {
      interval = setInterval(async () => {
        const data = await getSyncStatus();
        if (data.logs) {
          const lines = data.logs.split('\n').filter(l => l.trim() !== "");
          if (syncType === null) {
            // Full pipeline: append new logs
            setLogs(prev => {
              const existingMsgs = new Set(prev.map(l => l.msg));
              const newLines = lines.filter(l => !existingMsgs.has(l));
              return [...prev, ...newLines.map(l => ({
                msg: l,
                type: l.includes('ERROR') ? 'error' : l.includes('🚀') ? 'success' : 'info',
                time: new Date().toLocaleTimeString()
              }))];
            });
          } else {
            // Wasabi sync: replace logs
            setLogs(lines.map(l => ({
              msg: l,
              type: l.includes('ERROR') ? 'error' : l.includes('🚀') ? 'success' : 'info',
              time: new Date().toLocaleTimeString()
            })));
          }
        }
        if (data.status === 'COMPLETED') {
          if (view === 'processing') {
            setView('done');
          }
          setConnectedJobId(null);
          clearInterval(interval);
        }
        else if (data.status === 'FAILED') {
          setError("Sync failed.");
          if (view === 'processing') {
            setView('start');
          }
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
      // keep snapshot in sync when not viewing processing
      prevLogsSnapshotRef.current = JSON.stringify(logs);
      return;
    }

    const snapshot = logs.map(l => `${l.time}|${l.msg}`).join('\n');
    // If nothing changed, don't force scroll
    if (snapshot === prevLogsSnapshotRef.current) return;

    // Only auto-scroll when new content appears
    logsRef.current.scrollTop = logsRef.current.scrollHeight;
    prevLogsSnapshotRef.current = snapshot;
  }, [logs, view]);

  const downloadLogs = () => {
    const logsText = logs.map(l => `[${l.time}] $ ${l.msg}`).join('\n');
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(logsText));
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
        setLogs(prev => [...prev, {
          msg: '❌ Sync cancelled by user',
          type: 'error',
          time: new Date().toLocaleTimeString()
        }]);
        setView('start');
      } else {
        setError(result.message || 'Failed to cancel sync');
      }
    } catch (err) {
      setError('Error cancelling sync: ' + err.message);
    }
  };

  const connectToJob = (jobId, jobStatus) => {
    if (jobStatus === 'RUNNING') {
      setConnectedJobId(jobId);
      setActiveTab('dashboard');
      setView('processing');
      setLogs([]);
    }
  };

  const renderHistory = () => (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold dark:text-white flex items-center gap-2">
          <History className="w-5 h-5 text-indigo-500" /> Sync History
        </h2>
        <div className="flex items-center gap-4">
          <button
            onClick={loadHistory}
            className="px-3 py-1.5 text-sm rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4 text-slate-500" />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleClearHistory}
            className="px-3 py-1.5 text-sm rounded-lg bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-800 transition-colors flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4 text-red-600 dark:text-red-300" />
            <span>Clear History</span>
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {historyLoading ? (
          <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mx-auto mb-2" />
            <p className="text-slate-500 dark:text-slate-400">Loading sync history...</p>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
            <Clock className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500">No sync history found.</p>
          </div>
        ) : (
          history.map((job) => (
            <div key={job.id} className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-hover hover:shadow-md">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${job.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                    job.status === 'FAILED' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    }`}>
                    {job.status}
                  </span>
                  <span className="text-slate-400 text-sm">Job #{job.id}</span>
                </div>
                <div className="flex items-center gap-2">
                  {job.status === 'RUNNING' && (
                    <button
                      onClick={() => connectToJob(job.id, job.status)}
                      className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                    >
                      Connect
                    </button>
                  )}
                  <span className="text-xs text-slate-500">{new Date(job.start_time).toLocaleString()}</span>
                </div>
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400 font-mono line-clamp-2 bg-slate-50 dark:bg-slate-900/50 p-2 rounded">
                {job.logs.split('\n').slice(-2)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderReview = () => {
    const groupKeys = Object.keys(groups);
    const totalFiles = groupKeys.reduce((acc, key) => acc + groups[key].length, 0);

    return (
      <div className="max-w-5xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Header Section */}
        <div className="sticky top-20 z-10 bg-gray-50/95 dark:bg-slate-900/95 backdrop-blur-sm py-4 mb-6 border-b border-gray-200/50 dark:border-slate-700/50 -mx-4 px-4 sm:mx-0 sm:px-0 sm:bg-transparent sm:backdrop-blur-none sm:border-none sm:static transition-colors">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 transition-colors">
                Review Files
                <span className="text-sm font-normal text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 ml-2 transition-colors">{totalFiles} found</span>
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 transition-colors">Select the files you want to move to your organized folders.</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setShowFullNames(!showFullNames)}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-all border ${showFullNames
                  ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-sm dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700'
                  }`}
              >
                <WrapText className="w-4 h-4" />
                <span>{showFullNames ? 'Collapse Names' : 'Full Names'}</span>
              </button>

              <button
                onClick={handleDropboxSync}
                className="px-4 py-2.5 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 hover:border-slate-300 rounded-lg text-sm font-medium flex items-center gap-2 transition-all"
              >
                <RefreshCw className="w-4 h-4" /> Rescan
              </button>

              <button
                onClick={handleMove}
                disabled={selectedFiles.size === 0}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed dark:disabled:bg-slate-800 dark:disabled:text-slate-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-2 transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <MoveRight className="w-4 h-4" />
                <span>Move {selectedFiles.size} Files</span>
              </button>
            </div>
          </div>
        </div>

        {groupKeys.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 transition-colors">
            <FolderOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p>No files found in <code className="text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-1 rounded">/shared_sessions</code></p>
          </div>
        ) : (
          <div className="space-y-8">
            {groupKeys.map(gName => {
              const files = groups[gName];
              const validFiles = files.filter(f => f.isValid);
              const groupIds = validFiles.map(f => f.id);
              const allSelected = validFiles.length > 0 && groupIds.every(id => selectedFiles.has(id));
              const someSelected = validFiles.length > 0 && groupIds.some(id => selectedFiles.has(id));

              return (
                <div key={gName} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden transition-shadow hover:shadow-md">
                  {/* Group Header */}
                  <div
                    className="bg-slate-50/50 dark:bg-slate-700/30 px-5 py-4 border-b border-slate-100 dark:border-slate-700/50 flex items-center gap-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                    onClick={() => toggleGroup(gName, files)}
                  >
                    <div className="flex-shrink-0">
                      {validFiles.length > 0 ? (
                        allSelected ? (
                          <div className="bg-indigo-600 text-white rounded p-0.5"><CheckSquare className="w-5 h-5" /></div>
                        ) : someSelected ? (
                          <div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center"><div className="w-3 h-0.5 bg-white rounded-full"></div></div>
                        ) : (
                          <Square className="w-6 h-6 text-slate-300 dark:text-slate-500 hover:text-slate-400 dark:hover:text-slate-400" />
                        )
                      ) : (
                        <Square className="w-6 h-6 text-slate-200 dark:text-slate-600 cursor-not-allowed" />
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="bg-amber-100 dark:bg-amber-900/30 p-1.5 rounded-lg text-amber-600 dark:text-amber-400">
                        <Folder className="w-5 h-5" />
                      </div>
                      <span className="font-bold text-slate-700 dark:text-slate-200 text-lg">{gName}</span>
                    </div>

                    <span className="text-xs font-medium bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-full ml-auto">{files.length} items</span>
                  </div>

                  {/* Files List */}
                  <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
                    {files.map(file => {
                      const isSelected = selectedFiles.has(file.id);
                      return (
                        <div
                          key={file.id}
                          className={`px-5 py-4 flex items-start gap-4 transition-all duration-200 ${file.isValid
                            ? 'hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer'
                            : 'bg-red-50/30 dark:bg-red-900/10 cursor-not-allowed opacity-90'
                            } ${isSelected ? 'bg-indigo-50/40 dark:bg-indigo-900/20' : ''}`}
                          onClick={() => toggleSelect(file.id, file.isValid)}
                        >
                          <div className="mt-1 flex-shrink-0">
                            {file.isValid ? (
                              isSelected ? (
                                <div className="text-indigo-600 dark:text-indigo-400"><CheckSquare className="w-5 h-5" /></div>
                              ) : (
                                <Square className="w-5 h-5 text-slate-300 dark:text-slate-500 hover:text-slate-400 dark:hover:text-slate-400" />
                              )
                            ) : (
                              <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-start gap-x-3 gap-y-1 mb-1.5">
                              <FileAudio className={`w-5 h-5 shrink-0 mt-0.5 ${file.isValid ? 'text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`} />

                              <span className={`text-[15px] leading-6 font-medium ${showFullNames ? 'break-words whitespace-normal w-full' : 'truncate max-w-[calc(100%-2rem)]'
                                } ${file.isValid ? 'text-slate-700 dark:text-slate-200' : 'text-slate-500 dark:text-slate-500 line-through decoration-slate-400 dark:decoration-slate-600'}`}>
                                {file.name}
                              </span>

                              {!file.isValid && (
                                <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/30 px-2 py-0.5 rounded-full border border-red-200 dark:border-red-800">
                                  <AlertCircle className="w-3 h-3" />
                                  {file.validationError}
                                </span>
                              )}

                              {file.isValid && file.spellingWarning && (
                                <div className="inline-flex items-center gap-1 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded-full shrink-0" title={file.spellingWarning}>
                                  <AlertTriangle className="w-3 h-3" />
                                  <span className="text-xs font-medium">{file.spellingWarning}</span>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center text-xs text-slate-500 dark:text-slate-400 gap-2 font-mono ml-8 overflow-hidden">
                              <div className="flex items-center gap-1 truncate text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors bg-slate-50 dark:bg-slate-700/50 px-1.5 py-0.5 rounded">
                                <span className="opacity-60">src:</span>
                                <span className="truncate">.../{file.group}</span>
                              </div>
                              {file.isValid && (
                                <>
                                  <ChevronRight className="w-3 h-3 text-slate-300 dark:text-slate-600 flex-shrink-0" />
                                  <div className="flex items-center gap-1 truncate text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded border border-emerald-100 dark:border-emerald-800">
                                    <span className="opacity-60">dest:</span>
                                    <span className="truncate font-medium">{file.destPath}</span>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 transition-colors duration-300">
      <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-white/70 dark:bg-slate-900/70 border-b border-slate-200/60 dark:border-slate-800/60">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600 p-2 rounded-lg"><FolderOpen className="w-5 h-5 text-white" /></div>
              <h1 className="text-lg font-bold dark:text-white hidden sm:block">Session Sync</h1>
            </div>
            <nav className="flex items-center gap-1">
              <button
                onClick={() => { setActiveTab('dashboard'); setView('start'); }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'dashboard' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >
                <LayoutDashboard className="w-4 h-4" /> Dashboard
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'history' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >
                <History className="w-4 h-4" /> History
              </button>
            </nav>
          </div>
          <button onClick={toggleTheme} className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {activeTab === 'dashboard' ? (
          view === 'start' ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
              <div className="bg-white dark:bg-slate-800 p-12 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 max-w-2xl w-full">
                <h2 className="text-3xl font-bold mb-3 dark:text-white text-center">System Concepts</h2>
                <h4 className="text-lg font-semibold mb-3 dark:text-slate-300 text-center text-slate-600">Session Sync</h4>
                <p className="text-slate-500 dark:text-slate-400 mb-8 text-center">Update System Concepts Sessions</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-3">
                    <h3 className="font-semibold dark:text-white text-sm">Step 1: Organize Dropbox</h3>
                    <button onClick={handleDropboxSync} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg shadow-lg transition-transform hover:-translate-y-0.5 flex items-center justify-center gap-2">
                      <Folder className="w-4 h-4" /> Scan
                    </button>
                  </div>
                  <div className="flex flex-col gap-3">
                    <h3 className="font-semibold dark:text-white text-sm">Step 2: Upload to Wasabi</h3>
                    <button onClick={handleWasabiSync} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg shadow-lg transition-transform hover:-translate-y-0.5 flex items-center justify-center gap-2">
                      <MoveRight className="w-4 h-4" /> Upload
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : view === 'review' ? (
            renderReview()
          ) : (
            <div className="max-w-3xl mx-auto flex flex-col items-center py-10">
              <div className="mb-6">{view === 'done' ? <CheckCircle2 className="w-16 h-16 text-emerald-500" /> : <Loader2 className="w-16 h-16 animate-spin text-indigo-600" />}</div>
              <div className="w-full mb-4">
                <h3 className="text-lg font-semibold dark:text-white mb-3">
                  {syncType === 'dropbox' && '📁 Syncing Dropbox'}
                  {syncType === 'wasabi' && '☁️ Syncing to Wasabi'}
                  {syncType === null && '🔄 Running Full Pipeline'}
                </h3>
              </div>
              <div className="w-full flex justify-between items-center mb-2 gap-2">
                <button onClick={downloadLogs} className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
                  <ExternalLink className="w-4 h-4" /> Download Logs
                </button>
                {view !== 'done' && (
                  <button
                    onClick={handleCancelSync}
                    className="px-3 py-1.5 text-sm rounded-lg bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-800 transition-colors flex items-center gap-2 font-semibold"
                  >
                    <X className="w-4 h-4 text-red-600 dark:text-red-300" />
                    <span>Cancel Sync</span>
                  </button>
                )}
              </div>
              <div ref={logsRef} className="w-full bg-slate-900 p-4 rounded-lg font-mono text-xs text-slate-300 h-96 overflow-y-auto">
                {logs.map((l, i) => <div key={i} className="mb-1">[{l.time}] $ {l.msg}</div>)}
              </div>
            </div>
          )
        ) : renderHistory()}

        {/* Cancel Sync Confirmation Dialog */}
        {showCancelDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Cancel Sync?</h2>
              <p className="text-slate-700 dark:text-slate-300 mb-6">
                Are you sure you want to cancel the sync? This may interrupt the current process.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowCancelDialog(false)}
                  className="px-4 py-2 text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-slate-700 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors font-medium"
                >
                  Keep Syncing
                </button>
                <button
                  onClick={confirmCancelSync}
                  className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 rounded-lg transition-colors font-medium"
                >
                  Cancel Sync
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Clear History Confirmation Dialog */}
        {showClearHistoryDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Clear Sync History?</h2>
              <p className="text-slate-700 dark:text-slate-300 mb-6">
                This will permanently remove the sync history from the server. This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={declineClearHistory}
                  className="px-4 py-2 text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-slate-700 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors font-medium"
                >
                  Keep History
                </button>
                <button
                  onClick={confirmClearHistory}
                  className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 rounded-lg transition-colors font-medium"
                >
                  Clear History
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}