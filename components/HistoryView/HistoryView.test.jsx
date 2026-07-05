import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HistoryView from './HistoryView';

describe('HistoryView', () => {
  const sampleJob = {
    id: 1,
    status: 'COMPLETED',
    start_time: '2026-01-15T12:00:00.000Z',
    logs: 'sync complete',
  };

  it('renders header actions', () => {
    render(
      <HistoryView
        history={[]}
        historyLoading={false}
        onRefresh={jest.fn()}
        onClearHistory={jest.fn()}
        onConnect={jest.fn()}
      />,
    );

    expect(screen.getByRole('heading', { name: /sync history/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /clear history/i })).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(
      <HistoryView
        history={[]}
        historyLoading={true}
        onRefresh={jest.fn()}
        onClearHistory={jest.fn()}
        onConnect={jest.fn()}
      />,
    );

    expect(screen.getByText('Loading sync history...')).toBeInTheDocument();
  });

  it('shows empty state when history is empty', () => {
    render(
      <HistoryView
        history={[]}
        historyLoading={false}
        onRefresh={jest.fn()}
        onClearHistory={jest.fn()}
        onConnect={jest.fn()}
      />,
    );

    expect(screen.getByText('No sync history found.')).toBeInTheDocument();
  });

  it('renders history job cards', () => {
    render(
      <HistoryView
        history={[sampleJob]}
        historyLoading={false}
        onRefresh={jest.fn()}
        onClearHistory={jest.fn()}
        onConnect={jest.fn()}
      />,
    );

    expect(screen.getByText('Job #1')).toBeInTheDocument();
  });

  it('calls refresh and clear handlers', async () => {
    const onRefresh = jest.fn();
    const onClearHistory = jest.fn();
    const user = userEvent.setup();

    render(
      <HistoryView
        history={[]}
        historyLoading={false}
        onRefresh={onRefresh}
        onClearHistory={onClearHistory}
        onConnect={jest.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: /refresh/i }));
    await user.click(screen.getByRole('button', { name: /clear history/i }));

    expect(onRefresh).toHaveBeenCalledTimes(1);
    expect(onClearHistory).toHaveBeenCalledTimes(1);
  });
});
