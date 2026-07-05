import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StartScreen from './StartScreen';

describe('StartScreen', () => {
  it('renders sync workflow steps', () => {
    render(<StartScreen onDropboxSync={jest.fn()} onWasabiSync={jest.fn()} />);

    expect(screen.getByRole('heading', { name: 'System Concepts' })).toBeInTheDocument();
    expect(screen.getByText('Step 1: Organize Dropbox')).toBeInTheDocument();
    expect(screen.getByText('Step 2: Upload to Wasabi')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /scan/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /upload/i })).toBeInTheDocument();
  });

  it('calls onDropboxSync when Scan is clicked', async () => {
    const onDropboxSync = jest.fn();
    const user = userEvent.setup();

    render(<StartScreen onDropboxSync={onDropboxSync} onWasabiSync={jest.fn()} />);

    await user.click(screen.getByRole('button', { name: /scan/i }));

    expect(onDropboxSync).toHaveBeenCalledTimes(1);
  });

  it('calls onWasabiSync when Upload is clicked', async () => {
    const onWasabiSync = jest.fn();
    const user = userEvent.setup();

    render(<StartScreen onDropboxSync={jest.fn()} onWasabiSync={onWasabiSync} />);

    await user.click(screen.getByRole('button', { name: /upload/i }));

    expect(onWasabiSync).toHaveBeenCalledTimes(1);
  });
});
