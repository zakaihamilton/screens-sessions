import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import ProcessingView from './ProcessingView';

describe('ProcessingView', () => {
  const defaultProps = {
    view: 'processing',
    syncType: 'wasabi',
    logs: [{ msg: 'Starting sync', type: 'info', time: '10:00:00' }],
    error: null,
    autoScroll: true,
    logsRef: createRef(),
    onDownloadLogs: jest.fn(),
    onToggleAutoScroll: jest.fn(),
    onCancelSync: jest.fn(),
    onDismissError: jest.fn(),
  };

  it('renders sync title and log output', () => {
    render(<ProcessingView {...defaultProps} />);

    expect(screen.getByText('☁️ Syncing to Wasabi')).toBeInTheDocument();
    expect(screen.getByText('[10:00:00] $ Starting sync')).toBeInTheDocument();
  });

  it('shows done state without cancel button', () => {
    render(<ProcessingView {...defaultProps} view="done" />);

    expect(screen.queryByRole('button', { name: /cancel sync/i })).not.toBeInTheDocument();
  });

  it('shows error banner with dismiss action', async () => {
    const onDismissError = jest.fn();
    const user = userEvent.setup();

    render(
      <ProcessingView
        {...defaultProps}
        error="Something went wrong"
        onDismissError={onDismissError}
      />,
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Dismiss' }));

    expect(onDismissError).toHaveBeenCalledTimes(1);
  });

  it('calls toolbar handlers', async () => {
    const onDownloadLogs = jest.fn();
    const onToggleAutoScroll = jest.fn();
    const onCancelSync = jest.fn();
    const user = userEvent.setup();

    render(
      <ProcessingView
        {...defaultProps}
        onDownloadLogs={onDownloadLogs}
        onToggleAutoScroll={onToggleAutoScroll}
        onCancelSync={onCancelSync}
      />,
    );

    await user.click(screen.getByRole('button', { name: /download logs/i }));
    await user.click(screen.getByRole('button', { name: /auto-scroll/i }));
    await user.click(screen.getByRole('button', { name: /cancel sync/i }));

    expect(onDownloadLogs).toHaveBeenCalledTimes(1);
    expect(onToggleAutoScroll).toHaveBeenCalledTimes(1);
    expect(onCancelSync).toHaveBeenCalledTimes(1);
  });
});
