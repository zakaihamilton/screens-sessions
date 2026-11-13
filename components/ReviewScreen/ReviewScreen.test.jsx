import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ReviewScreen from './ReviewScreen';

describe('ReviewScreen', () => {
  const groups = {
    'group-a': [
      {
        id: 'file-1',
        name: 'audio-one.mp3',
        isValid: true,
        group: 'group-a',
        destPath: '/dest/audio-one.mp3',
      },
    ],
    'group-b': [
      {
        id: 'file-2',
        name: 'audio-two.mp3',
        isValid: true,
        group: 'group-b',
        destPath: '/dest/audio-two.mp3',
      },
    ],
  };

  const defaultProps = {
    groups,
    selectedFiles: new Set(['file-1']),
    showFullNames: false,
    onToggleFullNames: jest.fn(),
    onRescan: jest.fn(),
    onMove: jest.fn(),
    onToggleSelect: jest.fn(),
    onToggleGroup: jest.fn(),
  };

  it('renders file groups and total count', () => {
    render(<ReviewScreen {...defaultProps} />);

    expect(screen.getByRole('heading', { name: /review files/i })).toBeInTheDocument();
    expect(screen.getByText('2 found')).toBeInTheDocument();
    expect(screen.getByText('group-a')).toBeInTheDocument();
    expect(screen.getByText('group-b')).toBeInTheDocument();
  });

  it('shows empty state when no groups exist', () => {
    render(<ReviewScreen {...defaultProps} groups={{}} />);

    expect(screen.getByText(/no files found/i)).toBeInTheDocument();
  });

  it('disables move button when nothing is selected', () => {
    render(<ReviewScreen {...defaultProps} selectedFiles={new Set()} />);

    expect(screen.getByRole('button', { name: /move 0 files/i })).toBeDisabled();
  });

  it('calls action handlers from toolbar buttons', async () => {
    const onToggleFullNames = jest.fn();
    const onRescan = jest.fn();
    const onMove = jest.fn();
    const user = userEvent.setup();

    render(
      <ReviewScreen
        {...defaultProps}
        onToggleFullNames={onToggleFullNames}
        onRescan={onRescan}
        onMove={onMove}
      />,
    );

    await user.click(screen.getByRole('button', { name: /full names/i }));
    await user.click(screen.getByRole('button', { name: /rescan/i }));
    await user.click(screen.getByRole('button', { name: /move 1 files/i }));

    expect(onToggleFullNames).toHaveBeenCalledTimes(1);
    expect(onRescan).toHaveBeenCalledTimes(1);
    expect(onMove).toHaveBeenCalledTimes(1);
  });
});
