'use client';

import React, { useState, useEffect } from 'react';
import {
  Folder,
  FileAudio,
  MoveRight,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Loader2,
  RefreshCw,
  FolderOpen,
  CheckSquare,
  Square,
  WrapText,
  FileText,
  Terminal,
  ChevronRight,
  Sun,
  Moon
} from 'lucide-react';

// Import Server Actions
import { scanDropboxServer, moveFilesServer } from './actions';

export default function App() {
  const [view, setView] = useState('start'); // 'start', 'scanning', 'review', 'moving', 'done'
  const [logs, setLogs] = useState([]);
  const [groups, setGroups] = useState({});
  const [selectedFiles, setSelectedFiles] = useState(new Set());
  const [error, setError] = useState(null);
  const [showFullNames, setShowFullNames] = useState(false);
  const [theme, setTheme] = useState('light'); // 'light' or 'dark'

  // Initialize theme
  useEffect(() => {
    // Check localStorage first, then system preference
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setTheme('dark');
      document.documentElement.classList.add('dark');
    } else {
      setTheme('light');
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
      document.documentElement.classList.add('dark');
      localStorage.theme = 'dark';
    } else {
      setTheme('light');
      document.documentElement.classList.remove('dark');
      localStorage.theme = 'light';
    }
  };

  const addLog = (msg, type = 'info') => {
    setLogs(prev => [...prev, { msg, type, time: new Date().toLocaleTimeString() }]);
  };

  // --- 1. Scanning (Calls Server) ---
  const handleScan = async () => {
    setView('scanning');
    setLogs([]);
    setError(null);
    addLog('Requesting server to scan Dropbox...');

    try {
      const response = await scanDropboxServer();

      if (!response.success) {
        throw new Error(response.error);
      }

      const foundGroups = response.data;
      const groupCount = Object.keys(foundGroups).length;
      const fileCount = Object.values(foundGroups).flat().length;

      addLog(`Server found ${fileCount} files in ${groupCount} groups.`);
      setGroups(foundGroups);

      // Auto-select all valid files
      const allIds = new Set();
      Object.values(foundGroups).flat().forEach(f => {
        if (f.isValid && !f.spellingWarning) {
          allIds.add(f.id);
        }
      });
      setSelectedFiles(allIds);

      setView('review');

    } catch (err) {
      setError(err.message);
      addLog(`Error: ${err.message}`, 'error');
      setView('start');
    }
  };

  // --- 2. Moving (Calls Server) ---
  const handleMove = async () => {
    setView('moving');

    const filesToMove = Object.values(groups)
      .flat()
      .filter(f => selectedFiles.has(f.id));

    if (filesToMove.length === 0) return;

    addLog(`Instructing server to move ${filesToMove.length} files...`);

    try {
      const response = await moveFilesServer(filesToMove);

      if (!response.success) {
        throw new Error(response.error);
      }

      addLog('Server reported success.');
      setView('done');
    } catch (err) {
      setError(err.message);
      addLog(`Move Failed: ${err.message}`, 'error');
      setView('review'); // Go back to review on failure
    }
  };

  // --- UI Helpers ---
  const toggleSelect = (id, isValid) => {
    if (!isValid) return; // Prevent selecting invalid files
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

  // --- Render Views ---
  const renderStart = () => (
    <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in zoom-in duration-500">
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl p-8 sm:p-12 rounded-2xl shadow-xl border border-white/50 dark:border-slate-700/50 max-w-lg w-full text-center relative overflow-hidden transition-colors">
        {/* Decorative background blob */}
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-blue-400/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-purple-400/20 rounded-full blur-3xl"></div>

        <div className="relative">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-700 dark:to-slate-800 p-6 rounded-full inline-flex mb-8 shadow-inner ring-1 ring-blue-100 dark:ring-slate-600 transition-colors">
            <FolderOpen className="w-12 h-12 text-blue-600 dark:text-blue-400 drop-shadow-sm" />
          </div>
          <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-3 tracking-tight transition-colors">Session Organizer</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-10 leading-relaxed transition-colors">
            Ready to organize your Dropbox files? <br/>
            This tool scans <code className="bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-700 dark:text-slate-200 font-mono text-sm border border-slate-200 dark:border-slate-600 transition-colors">/shared_sessions</code> and groups them by year.
          </p>

          {error && (
            <div className="w-full mb-8 p-4 bg-red-50/80 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3 text-left shadow-sm">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-300 font-medium">{error}</p>
            </div>
          )}

          <button
            onClick={handleScan}
            className="w-full group relative overflow-hidden bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 text-white font-semibold py-4 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-3"
          >
            <span className="relative z-10 flex items-center gap-2">Start Scanning <MoveRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></span>
          </button>
        </div>
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
                className={`px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-all border ${
                    showFullNames
                    ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-sm dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700'
                }`}
                >
                <WrapText className="w-4 h-4" />
                <span>{showFullNames ? 'Collapse Names' : 'Full Names'}</span>
                </button>

                <button
                onClick={handleScan}
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
                <div key={gName} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden group-card transition-shadow hover:shadow-md">
                  {/* Group Header */}
                  <div
                    className="bg-slate-50/50 dark:bg-slate-700/30 px-5 py-4 border-b border-slate-100 dark:border-slate-700/50 flex items-center gap-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                    onClick={() => toggleGroup(gName, files)}
                  >
                    <div className="flex-shrink-0">
                        {validFiles.length > 0 ? (
                        allSelected ?
                            <div className="bg-indigo-600 text-white rounded p-0.5"><CheckSquare className="w-5 h-5" /></div> :
                            someSelected ?
                            <div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center"><div className="w-3 h-0.5 bg-white rounded-full"></div></div> :
                            <Square className="w-6 h-6 text-slate-300 dark:text-slate-500 hover:text-slate-400 dark:hover:text-slate-400" />
                        ) : <Square className="w-6 h-6 text-slate-200 dark:text-slate-600 cursor-not-allowed" />}
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
                          className={`px-5 py-4 flex items-start gap-4 transition-all duration-200 ${
                            file.isValid
                                ? 'hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer'
                                : 'bg-red-50/30 dark:bg-red-900/10 cursor-not-allowed opacity-90'
                          } ${isSelected ? 'bg-indigo-50/40 dark:bg-indigo-900/20' : ''}`}
                          onClick={() => toggleSelect(file.id, file.isValid)}
                        >
                          <div className="mt-1 flex-shrink-0">
                            {file.isValid ? (
                                isSelected ?
                                <div className="text-indigo-600 dark:text-indigo-400"><CheckSquare className="w-5 h-5" /></div> :
                                <Square className="w-5 h-5 text-slate-300 dark:text-slate-500 hover:text-slate-400 dark:hover:text-slate-400" />
                            ) : (
                                <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-start gap-x-3 gap-y-1 mb-1.5">
                              <FileAudio className={`w-5 h-5 shrink-0 mt-0.5 ${file.isValid ? 'text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`} />

                              <span className={`text-[15px] leading-6 font-medium ${
                                showFullNames ? 'break-words whitespace-normal w-full' : 'truncate max-w-[calc(100%-2rem)]'
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

  const renderProgress = (isDone) => (
    <div className="max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in zoom-in duration-300">
      <div className="mb-8 relative">
        {isDone ? (
             <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center animate-in zoom-in duration-300">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
             </div>
        ) : (
            <div className="relative">
                <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center">
                    <Loader2 className="w-10 h-10 animate-spin text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="absolute inset-0 rounded-full border-4 border-indigo-100 dark:border-indigo-800 border-t-indigo-600 dark:border-t-indigo-500 animate-spin"></div>
            </div>
        )}
      </div>

      <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">{isDone ? 'Operation Complete' : 'Processing...'}</h3>
      <p className="text-slate-500 dark:text-slate-400 mb-8">{isDone ? 'All selected files have been moved successfully.' : 'Please wait while we communicate with the server.'}</p>

      <div className="w-full max-w-xl mx-auto bg-slate-900 dark:bg-black rounded-lg shadow-2xl overflow-hidden border border-slate-800 dark:border-slate-800">
        <div className="bg-slate-800 dark:bg-slate-900 px-4 py-2 flex items-center gap-2 border-b border-slate-700">
            <Terminal className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-mono text-slate-400">Activity Log</span>
            <div className="ml-auto flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/50"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/50"></div>
            </div>
        </div>
        <div className="h-64 overflow-y-auto p-4 font-mono text-xs space-y-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
            {logs.length === 0 && <span className="text-slate-600 italic">Waiting for logs...</span>}
            {logs.map((l, i) => (
                <div key={i} className={`flex gap-3 ${l.type === 'error' ? 'text-red-400' : 'text-slate-300'}`}>
                    <span className="text-slate-600 shrink-0">[{l.time}]</span>
                    <span>
                        <span className="text-indigo-500 mr-2">$</span>
                        {l.msg}
                    </span>
                </div>
            ))}
            {/* Auto-scroll anchor */}
            <div className="scroll-anchor"></div>
        </div>
      </div>

      {isDone && (
        <button
            onClick={() => setView('start')}
            className="mt-10 px-8 py-3 bg-slate-900 dark:bg-indigo-600 text-white rounded-xl hover:bg-slate-800 dark:hover:bg-indigo-500 font-medium transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
        >
            Return to Home
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 pb-10 selection:bg-indigo-100 dark:selection:bg-indigo-900 selection:text-indigo-900 dark:selection:text-indigo-100 transition-colors duration-300">
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-white/70 dark:bg-slate-900/70 border-b border-slate-200/60 dark:border-slate-800/60 shadow-sm supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-slate-900/60 transition-colors duration-300">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="bg-gradient-to-tr from-indigo-600 to-blue-500 p-2 rounded-lg shadow-sm">
                    <FolderOpen className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-700 to-blue-600 dark:from-indigo-400 dark:to-blue-400 tracking-tight transition-all">
                    System Concepts - New Sessions
                </h1>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
                aria-label="Toggle Dark Mode"
              >
                {theme === 'light' ? (
                  <Moon className="w-5 h-5" />
                ) : (
                  <Sun className="w-5 h-5" />
                )}
              </button>

              {/* Simple status indicator if needed, or user profile placeholder */}
              <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 transition-colors">
                  <div className={`w-2 h-2 rounded-full ${view === 'scanning' || view === 'moving' ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`}></div>
                  {view === 'start' ? 'Ready' : view === 'review' ? 'Reviewing' : 'Processing'}
              </div>
            </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {view === 'start' && renderStart()}
        {(view === 'scanning' || view === 'moving' || view === 'done') && renderProgress(view === 'done')}
        {view === 'review' && renderReview()}
      </main>
    </div>
  );
}
