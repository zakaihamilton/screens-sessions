import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HistoryJobCard from './HistoryJobCard';

describe('HistoryJobCard', () => {
  const baseJob = {
    id: 42,
    status: 'COMPLETED',
    start_time: '2026-01-15T12:00:00.000Z',
    logs: 'line one\nline two\nline three',
  };

  it('renders job status, id, and log preview', () => {
    render(<HistoryJobCard job={baseJob} onConnect={jest.fn()} />);

    expect(screen.getByText('COMPLETED')).toBeInTheDocument();
    expect(screen.getByText('Job #42')).toBeInTheDocument();
    expect(screen.getByText(/line two/)).toBeInTheDocument();
    expect(screen.getByText(/line three/)).toBeInTheDocument();
  });

  it('shows Connect button for running jobs', async () => {
    const onConnect = jest.fn();
    const user = userEvent.setup();
    const runningJob = { ...baseJob, status: 'RUNNING' };

    render(<HistoryJobCard job={runningJob} onConnect={onConnect} />);

    await user.click(screen.getByRole('button', { name: 'Connect' }));

    expect(onConnect).toHaveBeenCalledWith(42, 'RUNNING');
  });

  it('hides Connect button for completed jobs', () => {
    render(<HistoryJobCard job={baseJob} onConnect={jest.fn()} />);

    expect(screen.queryByRole('button', { name: 'Connect' })).not.toBeInTheDocument();
  });
});
