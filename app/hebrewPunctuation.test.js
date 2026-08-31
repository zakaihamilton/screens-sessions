import { hasHebrewVowelPoints } from './hebrewPunctuation';

describe('hasHebrewVowelPoints', () => {
  it('does not flag Hebrew titles that only use ASCII hyphens', () => {
    expect(hasHebrewVowelPoints('פתיחה אותיות לו-מה')).toBe(false);
  });

  it('does not flag unpointed Hebrew letters', () => {
    expect(hasHebrewVowelPoints('פתיחה אותיות')).toBe(false);
  });

  it('does not flag English titles with punctuation', () => {
    expect(hasHebrewVowelPoints("CTC TES - opening 'session'")).toBe(false);
  });

  it('flags Hebrew letters that have vowel points', () => {
    expect(hasHebrewVowelPoints('פְּתִיחָה')).toBe(true);
  });

  it('flags precomposed Hebrew letters with points', () => {
    expect(hasHebrewVowelPoints('בּראשית')).toBe(true);
  });

  it('flags shin-dot presentation forms', () => {
    expect(hasHebrewVowelPoints('שׁלום')).toBe(true);
  });
});
