const DBX_API_URL = 'https://api.dropboxapi.com/2';
const DBX_OAUTH_URL = 'https://api.dropboxapi.com/oauth2/token';

/**
 * Exchanges the configured Dropbox refresh token for a short-lived access token.
 */
export async function getAccessToken() {
  const clientId = process.env.DROPBOX_APP_KEY;
  const clientSecret = process.env.DROPBOX_APP_SECRET;
  const refreshToken = process.env.DROPBOX_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      'Missing server-side environment variables: DROPBOX_APP_KEY, DROPBOX_APP_SECRET, or DROPBOX_REFRESH_TOKEN',
    );
  }

  const params = new URLSearchParams();
  params.append('grant_type', 'refresh_token');
  params.append('refresh_token', refreshToken);
  params.append('client_id', clientId);
  params.append('client_secret', clientSecret);

  const response = await fetch(DBX_OAUTH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
    cache: 'no-store',
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to refresh token: ${errorText}`);
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Performs a JSON RPC POST request against the Dropbox v2 API.
 */
export async function dbxRpc(endpoint, body, token) {
  const response = await fetch(`${DBX_API_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  });

  if (!response.ok) {
    const errorText = await response.text();
    if (response.status === 429) {
      throw new Error('Rate limit exceeded (429).');
    }
    throw new Error(`Dropbox API Error (${response.status}): ${errorText}`);
  }
  return response.json();
}

/**
 * Lists all entries in a Dropbox folder, handling cursor pagination automatically.
 */
export async function listAllFolderEntries(path, token) {
  let entries = [];
  let hasMore = true;
  let cursor = null;

  while (hasMore) {
    const result = await dbxRpc(
      cursor ? '/files/list_folder/continue' : '/files/list_folder',
      cursor ? { cursor } : { path, recursive: false },
      token,
    );
    entries = entries.concat(result.entries);
    cursor = result.cursor;
    hasMore = result.has_more;
  }

  return entries;
}

/**
 * Resolves a Dropbox move_batch_v2 result, polling async jobs until completion or failure.
 */
export async function pollBatchMove(startResult, token) {
  if (startResult['.tag'] === 'complete') {
    return startResult.entries;
  }

  if (startResult['.tag'] !== 'async_job_id') {
    return null;
  }

  const jobId = startResult.async_job_id;
  let jobStatus = 'in_progress';

  while (jobStatus === 'in_progress') {
    await new Promise((r) => setTimeout(r, 1000));
    const check = await dbxRpc('/files/move_batch/check_v2', { async_job_id: jobId }, token);
    if (check['.tag'] === 'complete') {
      jobStatus = 'complete';
      return check.entries;
    }
    if (check['.tag'] === 'failed') {
      throw new Error(`Batch Job Failed: ${check.toString()}`);
    }
  }

  return null;
}
