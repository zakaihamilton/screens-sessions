import { hasHebrewVowelPoints } from '../hebrewPunctuation';

const SESSION_FILENAME_REGEX = /([0-9]*-[0-9]*-[0-9]*) (.*)\.(.*)/;
const DATE_FORMAT_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const NON_STANDARD_LETTER_REGEX = /(?![a-zA-Z\u0590-\u05FF])\p{L}/u;
const DOUBLE_EXTENSION_REGEX = /\.(?:mp4|m4a)\.(?:mp4|m4a)$/i;
const ALLOWED_UPPERCASE_WORDS = new Set(['CTC', 'TES']);

const VALIDATION_RULES = {
  invalidDate: {
    test: ({ dateStr }) => !DATE_FORMAT_REGEX.test(dateStr),
    scanMessage: 'Invalid date format (YYYY-MM-DD)',
  },
  futureDate: {
    test: ({ dateStr, tomorrowStr }) => DATE_FORMAT_REGEX.test(dateStr) && dateStr > tomorrowStr,
    scanMessage: 'Session date is in the future',
    securityMessage: 'Security violation: Cannot move files with future dates.',
  },
  leadingSpace: {
    test: ({ titleStr }) => titleStr.startsWith(' '),
    scanMessage: 'Extra space between date and title',
  },
  trailingSpace: {
    test: ({ titleStr }) => titleStr.endsWith(' '),
    scanMessage: 'Space between title and extension',
  },
  doublePeriod: {
    test: ({ titleStr }) => titleStr.endsWith('.'),
    scanMessage: 'Double period before extension',
    securityMessage: 'Security violation: Cannot move files with double period before extension.',
  },
  doubleSpace: {
    test: ({ titleStr }) => titleStr.includes('  '),
    scanMessage: 'Double space in session name',
    securityMessage: 'Security violation: Cannot move files with double spaces in session name.',
  },
  leadingHyphen: {
    test: ({ titleStr }) => titleStr.startsWith('-'),
    scanMessage: 'Session name cannot start with a hyphen',
    securityMessage:
      'Security violation: Cannot move files with session name starting with a hyphen.',
  },
  nonStandardLetters: {
    test: ({ titleStr }) => NON_STANDARD_LETTER_REGEX.test(titleStr),
    scanMessage: 'Session name contains non-standard letters',
    securityMessage: 'Security violation: Cannot move files with non-standard letters.',
  },
  alreadyExists: {
    test: ({ existingDestPaths, destPath }) => existingDestPaths.has(destPath.toLowerCase()),
    scanMessage: 'File already exists in destination',
  },
  doubleExtension: {
    test: ({ filename }) => DOUBLE_EXTENSION_REGEX.test(filename),
    scanMessage: 'Double extension detected (e.g., .mp4.m4a)',
  },
};

const SCAN_RULES = [
  VALIDATION_RULES.invalidDate,
  VALIDATION_RULES.futureDate,
  VALIDATION_RULES.leadingSpace,
  VALIDATION_RULES.trailingSpace,
  VALIDATION_RULES.doublePeriod,
  VALIDATION_RULES.doubleSpace,
  VALIDATION_RULES.leadingHyphen,
  VALIDATION_RULES.nonStandardLetters,
  VALIDATION_RULES.alreadyExists,
  VALIDATION_RULES.doubleExtension,
];

const MOVE_SECURITY_RULES = [
  VALIDATION_RULES.doublePeriod,
  VALIDATION_RULES.doubleSpace,
  VALIDATION_RULES.leadingHyphen,
  VALIDATION_RULES.nonStandardLetters,
  VALIDATION_RULES.futureDate,
];

/**
 * Computes date threshold strings (YYYY-MM-DD) for future-date and staleness checks.
 */
export function getDateBoundaries() {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const threeWeeksAgo = new Date(today);
  threeWeeksAgo.setDate(threeWeeksAgo.getDate() - 21);

  return {
    tomorrowStr: tomorrow.toISOString().split('T')[0],
    threeWeeksAgoStr: threeWeeksAgo.toISOString().split('T')[0],
  };
}

function parseSessionFilename(filename) {
  const match = filename.match(SESSION_FILENAME_REGEX);
  if (!match) return null;

  const [_fullMatch, dateStr, titleStr] = match;
  const year = dateStr.split('-')[0];
  return { dateStr, titleStr, year };
}

/**
 * Collects unique year segments from session files in a group folder.
 */
export function extractNeededYears(groupFiles) {
  const neededYears = new Set();
  for (const file of groupFiles) {
    if (file['.tag'] === 'file') {
      const parsed = parseSessionFilename(file.name);
      if (parsed) {
        neededYears.add(parsed.year);
      }
    }
  }
  return neededYears;
}

function collectSpellingAndAgeWarnings({ dateStr, titleStr, threeWeeksAgoStr, spell }) {
  let isOld = false;
  let spellingWarning = null;

  if (dateStr < threeWeeksAgoStr) {
    isOld = true;
    spellingWarning = 'Session is older than 3 weeks';
  }

  const words = titleStr.split(/[^a-zA-Z\u0590-\u05FF']+/).filter((w) => w.length > 0);
  const misspelled = [];

  for (const word of words) {
    if (ALLOWED_UPPERCASE_WORDS.has(word)) {
      continue;
    }

    if (!spell.correct(word)) {
      const suggestions = spell.suggest(word);
      misspelled.push({ word, suggestions });
    }
  }

  if (misspelled.length > 0) {
    const spellMsg = `Possible spelling errors: ${misspelled
      .map((m) => {
        if (m.suggestions && m.suggestions.length > 0) {
          return `${m.word} (${m.suggestions.slice(0, 3).join(', ')})`;
        }
        return m.word;
      })
      .join(', ')}`;

    spellingWarning = spellingWarning ? `${spellingWarning}. ${spellMsg}` : spellMsg;
  }

  return { isOld, spellingWarning };
}

function validateScannedFile(
  file,
  { groupName, existingDestPaths, tomorrowStr, threeWeeksAgoStr, spell },
) {
  const parsed = parseSessionFilename(file.name);
  if (!parsed) return null;

  const { dateStr, titleStr, year } = parsed;
  const destPath = `/sessions/${groupName}/${year}/${file.name}`;
  const context = {
    dateStr,
    titleStr,
    tomorrowStr,
    existingDestPaths,
    destPath,
    filename: file.name,
  };

  let validationError = null;
  for (const rule of SCAN_RULES) {
    if (rule.test(context)) {
      validationError = rule.scanMessage;
      break;
    }
  }

  const privacyWarning =
    file.name.toLowerCase().includes('private') || file.name.includes('פרטי')
      ? 'file name is marked as private'
      : null;

  const hebrewPunctuationWarning = hasHebrewVowelPoints(titleStr)
    ? 'Hebrew title contains punctuation'
    : null;

  let spellingWarning = null;
  let isOld = false;

  if (!validationError) {
    const warnings = collectSpellingAndAgeWarnings({
      dateStr,
      titleStr,
      threeWeeksAgoStr,
      spell,
    });
    isOld = warnings.isOld;
    spellingWarning = warnings.spellingWarning;
  }

  return {
    id: file.id,
    name: file.name,
    path_lower: file.path_lower,
    path_display: file.path_display,
    group: groupName,
    year,
    destPath,
    isValid: !validationError,
    validationError,
    spellingWarning,
    privacyWarning,
    hebrewPunctuationWarning,
    isOld,
    datePart: dateStr,
    titlePart: titleStr,
  };
}

function applyCaseConsistencyCheck(files) {
  const caseCheckGroups = {};
  for (const file of files) {
    const key = `${file.datePart}|${file.titlePart.toLowerCase()}`;
    if (!caseCheckGroups[key]) {
      caseCheckGroups[key] = [];
    }
    caseCheckGroups[key].push(file);
  }

  for (const key in caseCheckGroups) {
    const groupFiles = caseCheckGroups[key];
    if (groupFiles.length > 1) {
      const firstTitle = groupFiles[0].titlePart;
      const hasMismatch = groupFiles.some((f) => f.titlePart !== firstTitle);
      if (hasMismatch) {
        for (const file of groupFiles) {
          file.isValid = false;
          file.validationError = file.validationError
            ? `${file.validationError}, Case mismatch between files`
            : 'Case mismatch between files';
        }
      }
    }
  }
}

/**
 * Validates, enriches, checks case consistency, and sorts scanned files for a group.
 */
export function validateGroupFiles(
  groupFiles,
  { groupName, existingDestPaths, tomorrowStr, threeWeeksAgoStr, spell },
) {
  const validFiles = groupFiles
    .filter((f) => f['.tag'] === 'file')
    .map((f) =>
      validateScannedFile(f, {
        groupName,
        existingDestPaths,
        tomorrowStr,
        threeWeeksAgoStr,
        spell,
      }),
    )
    .filter(Boolean);

  applyCaseConsistencyCheck(validFiles);

  if (validFiles.length > 0) {
    validFiles.sort((a, b) => {
      const dateCompare = (a.datePart || '').localeCompare(b.datePart || '');
      if (dateCompare !== 0) return dateCompare;
      return a.name.localeCompare(b.name);
    });
  }

  return validFiles;
}

/**
 * Validates source/destination paths and filename security rules before moving files.
 */
export function validateFilesForMove(filesToMove) {
  const { tomorrowStr } = getDateBoundaries();

  for (const file of filesToMove) {
    if (!file.path_lower.startsWith('/shared_sessions/')) {
      throw new Error(
        'Security violation: Invalid source path. Source files must be in /shared_sessions/.',
      );
    }
    if (!file.destPath.startsWith('/sessions/')) {
      throw new Error(
        'Security violation: Invalid destination path. Destination files must be in /sessions/.',
      );
    }

    if (file.name) {
      const parsed = parseSessionFilename(file.name);
      if (parsed) {
        const context = { dateStr: parsed.dateStr, titleStr: parsed.titleStr, tomorrowStr };
        for (const rule of MOVE_SECURITY_RULES) {
          if (rule.test(context)) {
            throw new Error(rule.securityMessage);
          }
        }
      }
    }
  }
}
