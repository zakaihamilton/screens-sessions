/**
 * Combining marks that attach to Hebrew letters: cantillation, niqqud (vowel
 * points), dagesh/mappiq, shin/sin dots, rafe, and related marks.
 * Standalone punctuation such as maqaf, geresh, and ASCII hyphens is excluded.
 */
const HEBREW_LETTER_POINTS = /[\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\uFB1E]/;

export function hasHebrewVowelPoints(titleStr) {
  // NFD splits presentation forms (e.g. בּ) into a base letter plus a point.
  return HEBREW_LETTER_POINTS.test(titleStr.normalize('NFD'));
}
