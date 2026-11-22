'use server';

import { dbxRpc, getAccessToken, listAllFolderEntries, pollBatchMove } from './lib/dropbox-client';
import {
  extractNeededYears,
  getDateBoundaries,
  validateFilesForMove,
  validateGroupFiles,
} from './lib/session-validator';
import { getSpellChecker } from './lib/spellcheck';

async function collectExistingDestPaths(groupName, neededYears, token) {
  const existingDestPaths = new Set();

  for (const year of neededYears) {
    const destYearPath = `/sessions/${groupName}/${year}`;
    try {
      const entries = await listAllFolderEntries(destYearPath, token);
      for (const entry of entries) {
        if (entry['.tag'] === 'file') {
          existingDestPaths.add(entry.path_lower);
        }
      }
    } catch (_e) {
      // Ignore error (folder likely doesn't exist yet)
    }
  }

  return existingDestPaths;
}

// --- Action: Scan Dropbox ---
export async function scanDropboxServer() {
  try {
    const token = await getAccessToken();
    const { tomorrowStr, threeWeeksAgoStr } = getDateBoundaries();
    const spell = await getSpellChecker();

    // 1. List folders in /shared_sessions
    const folders = await listAllFolderEntries('/shared_sessions', token);
    const groupFolders = folders.filter((f) => f['.tag'] === 'folder');
    const foundGroups = {};

    // 2. Scan each group folder
    for (const group of groupFolders) {
      const groupName = group.name;

      try {
        const groupFiles = await listAllFolderEntries(group.path_lower, token);

        // 3. Check for existing files in destination
        const neededYears = extractNeededYears(groupFiles);
        const existingDestPaths = await collectExistingDestPaths(groupName, neededYears, token);

        // 4. Filter, validate, check case consistency, and sort
        const validFiles = validateGroupFiles(groupFiles, {
          groupName,
          existingDestPaths,
          tomorrowStr,
          threeWeeksAgoStr,
          spell,
        });

        if (validFiles.length > 0) {
          foundGroups[groupName] = validFiles;
        }
      } catch (err) {
        console.error(`Error scanning group ${groupName}:`, err);
        // Continue scanning other groups even if one fails
      }
    }

    return { success: true, data: foundGroups };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// --- Action: Move Files ---
export async function moveFilesServer(filesToMove) {
  try {
    validateFilesForMove(filesToMove);

    const token = await getAccessToken();
    const entries = filesToMove.map((f) => ({
      from_path: f.path_lower,
      to_path: f.destPath,
    }));

    // Chunking (Batch limit is 1000, we use 500 for safety)
    const CHUNK_SIZE = 500;
    const chunks = [];
    for (let i = 0; i < entries.length; i += CHUNK_SIZE) {
      chunks.push(entries.slice(i, i + CHUNK_SIZE));
    }

    for (const chunk of chunks) {
      const startResult = await dbxRpc(
        '/files/move_batch_v2',
        {
          entries: chunk,
          autorename: false,
        },
        token,
      );

      await pollBatchMove(startResult, token);
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function getDropboxTokenForSync() {
  try {
    return await getAccessToken();
  } catch (error) {
    console.error('Failed to get token for sync handoff:', error);
    throw error;
  }
}
