import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FileRow from './FileRow';

describe('FileRow', () => {
  const validFile = {
    id: 'file-1',
    name: 'session-audio.mp3',
    isValid: true,
    group: 'group-a',
    destPath: '/organized/group-a/session-audio.mp3',
  };

  const invalidFile = {
    id: 'file-2',
    name: 'bad-file.mp3',
    isValid: false,
    group: 'group-a',
    validationError: 'Invalid filename format',
  };

  it('renders a valid file with destination path', () => {
    render(
      <FileRow
        file={validFile}
        isSelected={false}
        showFullNames={false}
        onToggleSelect={jest.fn()}
      />,
    );

    expect(screen.getByText('session-audio.mp3')).toBeInTheDocument();
    expect(screen.getByText('.../group-a')).toBeInTheDocument();
    expect(screen.getByText('/organized/group-a/session-audio.mp3')).toBeInTheDocument();
  });

  it('renders validation error for invalid files', () => {
    render(
      <FileRow
        file={invalidFile}
        isSelected={false}
        showFullNames={false}
        onToggleSelect={jest.fn()}
      />,
    );

    expect(screen.getByText('Invalid filename format')).toBeInTheDocument();
    expect(screen.queryByText('dest:')).not.toBeInTheDocument();
  });

  it('renders warning badges when present', () => {
    const fileWithWarnings = {
      ...validFile,
      spellingWarning: 'Possible typo',
      privacyWarning: 'Contains PII',
      hebrewPunctuationWarning: 'Hebrew punctuation issue',
    };

    render(
      <FileRow
        file={fileWithWarnings}
        isSelected={false}
        showFullNames={false}
        onToggleSelect={jest.fn()}
      />,
    );

    expect(screen.getByText('Possible typo')).toBeInTheDocument();
    expect(screen.getByText('Contains PII')).toBeInTheDocument();
    expect(screen.getByText('Hebrew punctuation issue')).toBeInTheDocument();
  });

  it('calls onToggleSelect with file id and validity when clicked', async () => {
    const onToggleSelect = jest.fn();
    const user = userEvent.setup();

    render(
      <FileRow
        file={validFile}
        isSelected={false}
        showFullNames={false}
        onToggleSelect={onToggleSelect}
      />,
    );

    await user.click(screen.getByText('session-audio.mp3'));

    expect(onToggleSelect).toHaveBeenCalledWith('file-1', true);
  });
});
