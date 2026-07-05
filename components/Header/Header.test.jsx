import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Header from './Header';

describe('Header', () => {
  it('renders the app title and navigation tabs', () => {
    render(
      <Header
        activeTab="dashboard"
        theme="light"
        onTabChange={jest.fn()}
        onToggleTheme={jest.fn()}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Session Sync' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /history/i })).toBeInTheDocument();
  });

  it('calls onTabChange when a nav tab is clicked', async () => {
    const onTabChange = jest.fn();
    const user = userEvent.setup();

    render(
      <Header
        activeTab="dashboard"
        theme="light"
        onTabChange={onTabChange}
        onToggleTheme={jest.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: /history/i }));

    expect(onTabChange).toHaveBeenCalledWith('history');
  });

  it('calls onToggleTheme when the theme button is clicked', async () => {
    const onToggleTheme = jest.fn();
    const user = userEvent.setup();

    render(
      <Header
        activeTab="dashboard"
        theme="light"
        onTabChange={jest.fn()}
        onToggleTheme={onToggleTheme}
      />,
    );

    await user.click(screen.getByRole('button', { name: '' }));

    expect(onToggleTheme).toHaveBeenCalledTimes(1);
  });
});
