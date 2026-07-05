'use server';

import { getDropboxTokenForSync } from './dropbox'; // Import the token helper

const SYNC_URL = process.env.SYNC_API_URL;
const SYNC_SECRET = process.env.SYNC_API_SECRET;

export async function startFullSyncProcess() {
  console.log('>>> Wasabi Sync Started');

  try {
    if (!SYNC_URL) throw new Error('SYNC_API_URL is not defined.');

    // 1. Get the fresh Dropbox Access Token
    const dbToken = await getDropboxTokenForSync();

    // 2. URL Sanitization
    let sanitizedUrl = SYNC_URL.trim();
    if (!sanitizedUrl.startsWith('http')) {
      sanitizedUrl = `https://${sanitizedUrl}`;
    }
    sanitizedUrl = sanitizedUrl.replace(/\/$/, '');

    // 3. Trigger Railway Sync with the Token Header
    console.log(`>>> Triggering Railway at: ${sanitizedUrl}/sync`);
    const response = await fetch(`${sanitizedUrl}/sync`, {
      method: 'POST',
      headers: {
        'x-api-key': SYNC_SECRET,
        'x-db-token': dbToken, // <--- Handing off the token here
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Railway responded with ${response.status}: ${errorText}`);
    }

    const railwayData = await response.json();
    console.log('>>> Railway Response:', railwayData);

    return railwayData;
  } catch (error) {
    console.error('>>> WASABI SYNC ERROR:', error.message);
    return { status: 'error', message: error.message };
  }
}

export async function getSyncStatus() {
  try {
    // Apply the same sanitization for the status endpoint
    let sanitizedUrl = SYNC_URL.trim().replace(/\/$/, '');
    if (!sanitizedUrl.startsWith('http')) sanitizedUrl = `https://${sanitizedUrl}`;

    const response = await fetch(`${sanitizedUrl}/status`, {
      method: 'GET',
      headers: { 'x-api-key': SYNC_SECRET },
      cache: 'no-store',
    });
    return await response.json();
  } catch (_error) {
    return { status: 'OFFLINE' };
  }
}

export async function getSyncHistory() {
  try {
    let sanitizedUrl = SYNC_URL.trim().replace(/\/$/, '');
    if (!sanitizedUrl.startsWith('http')) sanitizedUrl = `https://${sanitizedUrl}`;

    const response = await fetch(`${sanitizedUrl}/status?history=true`, {
      method: 'GET',
      headers: { 'x-api-key': SYNC_SECRET },
      cache: 'no-store',
    });

    if (!response.ok) return [];
    return await response.json();
  } catch (_error) {
    return [];
  }
}

export async function cancelSyncAction() {
  try {
    let sanitizedUrl = SYNC_URL.trim().replace(/\/$/, '');
    if (!sanitizedUrl.startsWith('http')) sanitizedUrl = `https://${sanitizedUrl}`;

    const response = await fetch(`${sanitizedUrl}/cancel`, {
      method: 'POST',
      headers: { 'x-api-key': SYNC_SECRET },
      cache: 'no-store',
    });
    return await response.json();
  } catch (error) {
    return { status: 'error', message: error.message };
  }
}

export async function clearHistoryAction() {
  try {
    let sanitizedUrl = SYNC_URL.trim().replace(/\/$/, '');
    if (!sanitizedUrl.startsWith('http')) sanitizedUrl = `https://${sanitizedUrl}`;

    const response = await fetch(`${sanitizedUrl}/clear-history`, {
      method: 'POST',
      headers: { 'x-api-key': SYNC_SECRET },
      cache: 'no-store',
    });
    return await response.json();
  } catch (error) {
    return { status: 'error', message: error.message };
  }
}
