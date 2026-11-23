import { extractNeededYears, validateFilesForMove, validateGroupFiles } from './session-validator';

const mockSpell = {
  correct: (word) => ['Hello', 'World', 'Session'].includes(word),
  suggest: (word) => [`${word}1`, `${word}2`],
};

function makeFile(name, id = name) {
  return {
    '.tag': 'file',
    id,
    name,
    path_lower: `/shared_sessions/group-a/${name.toLowerCase()}`,
    path_display: `/shared_sessions/group-a/${name}`,
  };
}

describe('session-validator', () => {
  describe('extractNeededYears', () => {
    it('collects unique years from matching session files', () => {
      const years = extractNeededYears([
        { '.tag': 'folder', name: '2025' },
        makeFile('2025-11-01 Session One.mp3'),
        makeFile('2025-12-01 Session Two.mp4'),
        makeFile('2026-01-01 Session Three.m4a'),
        makeFile('unmatched.txt'),
      ]);

      expect(Array.from(years).sort()).toEqual(['2025', '2026']);
    });
  });

  describe('validateGroupFiles', () => {
    const baseOpts = {
      groupName: 'group-a',
      existingDestPaths: new Set(['/sessions/group-a/2026/2026-02-01 existing.mp3']),
      tomorrowStr: '2026-05-02',
      threeWeeksAgoStr: '2026-04-10',
      spell: mockSpell,
    };

    it('validates valid files, allows CTC/TES, and flags warnings', () => {
      const result = validateGroupFiles(
        [
          makeFile('2026-04-20 CTC Hello TES.mp3', '1'),
          makeFile('2026-04-01 Private Typo.mp3', '2'),
        ],
        baseOpts,
      );

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: '2',
        isValid: true,
        isOld: true,
        privacyWarning: 'file name is marked as private',
        spellingWarning:
          'Session is older than 3 weeks. Possible spelling errors: Private (Private1, Private2), Typo (Typo1, Typo2)',
      });
      expect(result[1]).toMatchObject({
        id: '1',
        isValid: true,
        isOld: false,
        spellingWarning: null,
        privacyWarning: null,
      });
    });

    it('detects filename validation errors and case mismatches', () => {
      const result = validateGroupFiles(
        [
          makeFile('2026-02-01 Existing.mp3', 'dup'),
          makeFile('2026-05-03 Hello.mp3', 'future'),
          makeFile('2026-04-20 Hello..mp3', 'period'),
          makeFile('2026-04-20 Hello World.mp3', 'case-a'),
          makeFile('2026-04-20 hello world.mp4', 'case-b'),
        ],
        baseOpts,
      );

      const byId = Object.fromEntries(result.map((f) => [f.id, f]));
      expect(byId.dup.validationError).toBe('File already exists in destination');
      expect(byId.future.validationError).toBe('Session date is in the future');
      expect(byId.period.validationError).toBe('Double period before extension');
      expect(byId['case-a'].isValid).toBe(false);
      expect(byId['case-a'].validationError).toBe('Case mismatch between files');
      expect(byId['case-b'].validationError).toBe('Case mismatch between files');
    });
  });

  describe('validateFilesForMove', () => {
    it('allows valid shared_sessions to sessions moves', () => {
      expect(() =>
        validateFilesForMove([
          {
            name: '2025-01-01 Hello.mp3',
            path_lower: '/shared_sessions/group-a/2025-01-01 hello.mp3',
            destPath: '/sessions/group-a/2025/2025-01-01 Hello.mp3',
          },
        ]),
      ).not.toThrow();
    });

    it('rejects invalid paths and disallowed filenames', () => {
      expect(() =>
        validateFilesForMove([
          {
            name: '2025-01-01 Hello.mp3',
            path_lower: '/other/file.mp3',
            destPath: '/sessions/group-a/2025/file.mp3',
          },
        ]),
      ).toThrow('Security violation: Invalid source path');

      expect(() =>
        validateFilesForMove([
          {
            name: '2025-01-01 -Hyphen.mp3',
            path_lower: '/shared_sessions/group-a/file.mp3',
            destPath: '/sessions/group-a/2025/file.mp3',
          },
        ]),
      ).toThrow('Security violation: Cannot move files with session name starting with a hyphen.');
    });
  });
});
