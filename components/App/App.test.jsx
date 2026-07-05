import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

jest.mock('@/app/dropbox', () => ({
  moveFilesServer: jest.fn(),
  scanDropboxServer: jest.fn(),
}));

jest.mock('@/app/sync', () => ({
  cancelSyncAction: jest.fn(),
  clearHistoryAction: jest.fn(),
  getSyncHistory: jest.fn(),
  getSyncStatus: jest.fn(),
  startFullSyncProcess: jest.fn(),
}));

import { scanDropboxServer } from '@/app/dropbox';
import { getSyncHistory, getSyncStatus, startFullSyncProcess } from '@/app/sync';

describe('App', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    getSyncHistory.mockResolvedValue([]);
    getSyncStatus.mockResolvedValue({ status: 'IDLE', logs: '' });
    startFullSyncProcess.mockResolvedValue({ status: 'ok' });
    scanDropboxServer.mockResolvedValue({
      success: true,
      data: {
        'group-a': [
          {
            id: 'file-1',
            name: 'session.mp3',
            isValid: true,
            group: 'group-a',
            destPath: '/dest/session.mp3',
          },
        ],
      },
    });
  });

  it('renders the start screen on load', () => {
    render(<App />);

    expect(screen.getByRole('heading', { level: 1, name: 'Session Sync' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /scan/i })).toBeInTheDocument();
  });

  it('switches to the history tab', async () => {
    const user = userEvent.setup();

    render(<App />);

    await user.click(screen.getByRole('button', { name: /history/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /sync history/i })).toBeInTheDocument();
    });
    expect(getSyncHistory).toHaveBeenCalled();
  });

  it('navigates to review after a successful dropbox scan', async () => {
    const user = userEvent.setup();

    render(<App />);

    await user.click(screen.getByRole('button', { name: /scan/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /review files/i })).toBeInTheDocument();
    });
    expect(scanDropboxServer).toHaveBeenCalledTimes(1);
    expect(screen.getByText('session.mp3')).toBeInTheDocument();
  });

  it('starts wasabi sync from the start screen', async () => {
    const user = userEvent.setup();

    render(<App />);

    await user.click(screen.getByRole('button', { name: /upload/i }));

    await waitFor(() => {
      expect(startFullSyncProcess).toHaveBeenCalledTimes(1);
    });
    expect(screen.getByText('☁️ Syncing to Wasabi')).toBeInTheDocument();
  });
});
