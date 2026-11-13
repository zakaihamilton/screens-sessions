import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FileGroup from './FileGroup';

describe('FileGroup', () => {
  const files = [
    {
      id: 'file-1',
      name: 'valid-one.mp3',
      isValid: true,
      group: 'sessions',
      destPath: '/dest/valid-one.mp3',
    },
    {
      id: 'file-2',
      name: 'valid-two.mp3',
      isValid: true,
      group: 'sessions',
      destPath: '/dest/valid-two.mp3',
    },
    {
      id: 'file-3',
      name: 'invalid.mp3',
      isValid: false,
      group: 'sessions',
      validationError: 'Bad name',
    },
  ];

  it('renders group name and file count', () => {
    render(
      <FileGroup
        groupName="sessions"
        files={files}
        selectedFiles={new Set()}
        showFullNames={false}
        onToggleGroup={jest.fn()}
        onToggleSelect={jest.fn()}
      />,
    );

    expect(screen.getByText('sessions')).toBeInTheDocument();
    expect(screen.getByText('3 items')).toBeInTheDocument();
    expect(screen.getByText('valid-one.mp3')).toBeInTheDocument();
    expect(screen.getByText('invalid.mp3')).toBeInTheDocument();
  });

  it('sorts files by date then name', () => {
    const unsortedFiles = [
      {
        id: 'file-3',
        name: '2024-05-12 Later Session.mp3',
        isValid: true,
        group: 'sessions',
        datePart: '2024-05-12',
        destPath: '/dest/later.mp3',
      },
      {
        id: 'file-1',
        name: '2024-05-10 Earlier Session.mp3',
        isValid: true,
        group: 'sessions',
        datePart: '2024-05-10',
        destPath: '/dest/earlier.mp3',
      },
      {
        id: 'file-2',
        name: '2024-05-10 Same Day B.mp3',
        isValid: true,
        group: 'sessions',
        datePart: '2024-05-10',
        destPath: '/dest/same-day-b.mp3',
      },
    ];

    render(
      <FileGroup
        groupName="sessions"
        files={unsortedFiles}
        selectedFiles={new Set()}
        showFullNames={false}
        onToggleGroup={jest.fn()}
        onToggleSelect={jest.fn()}
      />,
    );

    const renderedNames = screen.getAllByText(/^2024-05-\d{2} /).map((el) => el.textContent);
    expect(renderedNames).toEqual([
      '2024-05-10 Earlier Session.mp3',
      '2024-05-10 Same Day B.mp3',
      '2024-05-12 Later Session.mp3',
    ]);
  });

  it('calls onToggleGroup when header is clicked', async () => {
    const onToggleGroup = jest.fn();
    const user = userEvent.setup();

    render(
      <FileGroup
        groupName="sessions"
        files={files}
        selectedFiles={new Set()}
        showFullNames={false}
        onToggleGroup={onToggleGroup}
        onToggleSelect={jest.fn()}
      />,
    );

    await user.click(screen.getByText('sessions'));

    expect(onToggleGroup).toHaveBeenCalledWith('sessions', files);
  });
});
