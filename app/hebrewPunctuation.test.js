import { hasHebrewVowelPoints } from './hebrewPunctuation';

describe('hasHebrewVowelPoints', () => {
  it('does not flag the reported hyphenated Hebrew session title', () => {
    const filename = '2026-08-31 פתיחה אותיות לו-מה.m4a';
    const match = filename.match(/([0-9]*-[0-9]*-[0-9]*) (.*)\.(.*)/);
    expect(hasHebrewVowelPoints(match[2])).toBe(false);
  });

  it('does not flag unpointed Hebrew letters', () => {
    expect(hasHebrewVowelPoints('פתיחה אותיות')).toBe(false);
  });

  it('does not flag English titles with punctuation', () => {
    expect(hasHebrewVowelPoints("CTC TES - opening 'session'")).toBe(false);
  });

  it('does not flag standalone Hebrew punctuation such as maqaf or geresh', () => {
    expect(hasHebrewVowelPoints('לו\u05BEמה')).toBe(false);
    expect(hasHebrewVowelPoints('ג\u05F3')).toBe(false);
  });

  it('flags Hebrew letters that have vowel points', () => {
    // PE + PATAH, TAV + HIRIQ, YOD, HET + QAMATS, HE
    expect(hasHebrewVowelPoints('\u05E4\u05B7\u05EA\u05B4\u05D9\u05D7\u05B8\u05D4')).toBe(true);
  });

  it('flags precomposed Hebrew letters with points', () => {
    expect(hasHebrewVowelPoints('\uFB31\u05E8\u05D0\u05E9\u05D9\u05EA')).toBe(true);
  });

  it('flags shin-dot presentation forms', () => {
    expect(hasHebrewVowelPoints('\uFB2A\u05DC\u05D5\u05DD')).toBe(true);
  });
});
