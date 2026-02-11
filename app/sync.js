"use server";

import { scanDropboxServer, moveFilesServer } from './dropbox';

const SYNC_URL = process.env.SYNC_API_URL;
const SYNC_SECRET = process.env.SYNC_API_SECRET;

export async function startFullSyncProcess() {
    try {
        // 1. Scan Dropbox /shared_sessions
        const scanRes = await scanDropboxServer();
        if (!scanRes.success) throw new Error(`Scan failed: ${scanRes.error}`);

        const foundGroups = scanRes.data;
        const filesToMove = Object.values(foundGroups).flat().filter(f => f.isValid);

        let moveLogPrefix = "";
        if (filesToMove.length > 0) {
            // 2. Move files to /sessions/YYYY
            const moveRes = await moveFilesServer(filesToMove);
            if (!moveRes.success) throw new Error(`Move failed: ${moveRes.error}`);
            moveLogPrefix = `Successfully organized ${filesToMove.length} files in Dropbox.\n`;
        } else {
            moveLogPrefix = "No new files to organize in Dropbox. Checking for sync updates...\n";
        }

        // 3. Trigger Railway Sync
        const response = await fetch(`${SYNC_URL}/sync`, {
            method: "POST",
            headers: { "x-api-key": SYNC_SECRET },
            cache: 'no-store',
        });

        const railwayData = await response.json();
        // Prepend our Dropbox moves to the initial Railway logs
        return { ...railwayData, initialLogs: moveLogPrefix };

    } catch (error) {
        return { status: "error", message: error.message };
    }
}

export async function getSyncStatus() {
    try {
        const response = await fetch(`${SYNC_URL}/status`, {
            method: "GET",
            headers: { "x-api-key": SYNC_SECRET },
            cache: 'no-store',
        });
        return await response.json();
    } catch (error) {
        return { status: "OFFLINE" };
    }
}

export async function getSyncHistory() {
    try {
        const response = await fetch(`${SYNC_URL}/status?history=true`, {
            method: "GET",
            headers: { "x-api-key": SYNC_SECRET },
            cache: 'no-store',
        });

        if (!response.ok) return [];
        return await response.json();
    } catch (error) {
        return [];
    }
}