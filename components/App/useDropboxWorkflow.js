'use client';

import { useState } from 'react';
import { moveFilesServer, scanDropboxServer } from '@/app/dropbox';

/**
 * Manages the Dropbox scan, review selection, and file move workflow.
 */
export function useDropboxWorkflow({ setView, setActiveTab, setLogs, setError, setSyncType }) {
  const [groups, setGroups] = useState({});
  const [selectedFiles, setSelectedFiles] = useState(new Set());
  const [showFullNames, setShowFullNames] = useState(false);

  const addLog = (msg, type = 'info') => {
    setLogs((prev) => [...prev, { msg, type, time: new Date().toLocaleTimeString() }]);
  };

  const handleDropboxSync = async () => {
    setView('processing');
    setActiveTab('dashboard');
    setLogs([]);
    setError(null);
    setSyncType('dropbox');

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

  const toggleShowFullNames = () => setShowFullNames((prev) => !prev);

  return {
    groups,
    selectedFiles,
    showFullNames,
    toggleShowFullNames,
    handleDropboxSync,
    handleMove,
    toggleSelect,
    toggleGroup,
  };
}
