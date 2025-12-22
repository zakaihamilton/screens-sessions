'use client';

import React, { useState } from 'react';
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
  WrapText
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
    <div className="flex flex-col items-center justify-center p-6 sm:p-12 bg-white rounded-lg shadow-sm border border-gray-200 max-w-lg mx-auto mt-10">
      <div className="bg-blue-100 p-4 rounded-full mb-6">
        <FolderOpen className="w-10 h-10 text-blue-600" />
      </div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Screens Session Organizer</h2>
      <p className="text-gray-500 text-center mb-8">
        This tool runs on the server. It will scan <code>/shared_sessions</code> and organize files by year.
      </p>

      {error && (
        <div className="w-full mb-6 p-4 bg-red-50 border border-red-200 rounded-md flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <button
        onClick={handleScan}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-md transition-colors flex items-center justify-center gap-2"
      >
        Start Scan
      </button>
    </div>
  );

  const renderReview = () => {
    const groupKeys = Object.keys(groups);
    const totalFiles = groupKeys.reduce((acc, key) => acc + groups[key].length, 0);
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div className="mb-4 sm:mb-0">
            <h2 className="text-2xl font-bold text-gray-800">Review Files</h2>
            <p className="text-gray-500">Found {totalFiles} matches in {groupKeys.length} groups.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setShowFullNames(!showFullNames)}
              className={`px-4 py-2 rounded-md flex items-center justify-center sm:justify-start gap-2 border transition-colors ${
                showFullNames
                  ? 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200'
                  : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <WrapText className="w-4 h-4" />
              <span>{showFullNames ? 'Collapse Names' : 'Show Full Names'}</span>
            </button>
            <button onClick={handleScan} className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md flex items-center justify-center sm:justify-start gap-2">
              <RefreshCw className="w-4 h-4" /> Rescan
            </button>
            <button onClick={handleMove} disabled={selectedFiles.size === 0} className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-md shadow-sm disabled:opacity-50 flex items-center justify-center sm:justify-start gap-2">
              <MoveRight className="w-4 h-4" /> Move {selectedFiles.size} Files
            </button>
          </div>
        </div>
        {groupKeys.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 text-gray-500">No files found.</div>
        ) : (
          <div className="space-y-6">
            {groupKeys.map(gName => {
              const files = groups[gName];

              // Only consider valid files for group selection state
              const validFiles = files.filter(f => f.isValid);
              const groupIds = validFiles.map(f => f.id);

              const allSelected = validFiles.length > 0 && groupIds.every(id => selectedFiles.has(id));
              const someSelected = validFiles.length > 0 && groupIds.some(id => selectedFiles.has(id));

              return (
                <div key={gName} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center gap-3 cursor-pointer hover:bg-gray-100" onClick={() => toggleGroup(gName, files)}>
                    {validFiles.length > 0 ? (
                      allSelected ? <CheckSquare className="w-5 h-5 text-blue-600" /> : someSelected ? <div className="w-5 h-5 bg-blue-600 rounded-sm flex items-center justify-center"><div className="w-3 h-0.5 bg-white"></div></div> : <Square className="w-5 h-5 text-gray-400" />
                    ) : <Square className="w-5 h-5 text-gray-200 cursor-not-allowed" />}

                    <Folder className="w-5 h-5 text-yellow-500" />
                    <span className="font-semibold text-gray-700">{gName}</span>
                    <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full ml-auto">{files.length} files</span>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {files.map(file => {
                      const isSelected = selectedFiles.has(file.id);
                      return (
                        <div
                          key={file.id}
                          className={`px-4 py-3 flex items-center gap-4 transition-colors ${file.isValid ? 'hover:bg-blue-50 cursor-pointer' : 'bg-red-50 cursor-not-allowed'} ${isSelected ? 'bg-blue-50/50' : ''}`}
                          onClick={() => toggleSelect(file.id, file.isValid)}
                        >
                          <div className="">
                            {file.isValid ? (
                                isSelected ? <CheckSquare className="w-5 h-5 text-blue-600" /> : <Square className="w-5 h-5 text-gray-300 hover:text-gray-400" />
                            ) : (
                                <AlertCircle className="w-5 h-5 text-red-500" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <FileAudio className={`w-4 h-4 shrink-0 ${file.isValid ? 'text-purple-500' : 'text-gray-400'}`} />
                              <span className={`text-sm font-medium ${showFullNames ? 'break-words whitespace-normal' : 'truncate'} ${file.isValid ? 'text-gray-700' : 'text-gray-500 line-through'}`}>{file.name}</span>
                              {!file.isValid && <span className="text-xs text-red-600 bg-red-100 px-2 py-0.5 rounded-full shrink-0">{file.validationError}</span>}
                              {file.isValid && file.spellingWarning && (
                                <div className="flex items-center gap-1 bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full shrink-0" title={file.spellingWarning}>
                                  <AlertTriangle className="w-3 h-3" />
                                  <span className="text-xs">{file.spellingWarning}</span>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center text-xs text-gray-500 gap-2 font-mono">
                              <span className="truncate max-w-[40%] text-red-500">/shared_sessions/{file.group}</span>
                              {file.isValid && (
                                <>
                                  <MoveRight className="w-3 h-3 text-gray-300" />
                                  <span className="truncate max-w-[40%] text-green-600">{file.destPath}</span>
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
    <div className="max-w-lg mx-auto text-center py-10 sm:py-20">
      {isDone ? <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" /> : <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />}
      <h3 className="text-lg font-semibold text-gray-700">{isDone ? 'Operation Complete' : 'Processing...'}</h3>
      <div className="mt-4 max-w-md mx-auto h-48 overflow-y-auto text-xs text-gray-500 bg-white p-4 rounded border font-mono text-left shadow-sm">
        {logs.map((l, i) => <div key={i} className={`mb-1 ${l.type === 'error' ? 'text-red-500' : ''}`}>[{l.time}] {l.msg}</div>)}
      </div>
      {isDone && <button onClick={() => setView('start')} className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Done</button>}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-slate-900 pb-20">
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 mb-8 sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg"><FolderOpen className="w-6 h-6 text-white" /></div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">Screens Sessions Organizer</h1>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {view === 'start' && renderStart()}
        {(view === 'scanning' || view === 'moving' || view === 'done') && renderProgress(view === 'done')}
        {view === 'review' && renderReview()}
      </div>
    </div>
  );
}
