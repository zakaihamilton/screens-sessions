import { createRequire } from 'node:module';
import dictionaryEn from 'dictionary-en';
import dictionaryHe from 'dictionary-he';

const require = createRequire(import.meta.url);
const hunspellAsm = require('hunspell-asm');
const { loadModule } = hunspellAsm;

// Singleton for Spell Checker
let spellChecker = null;

/**
 * Initializes and caches the Hunspell WASM English/Hebrew spell checker.
 * Fails gracefully by marking all words valid if WASM initialization fails.
 */
export async function getSpellChecker() {
  if (spellChecker) return spellChecker;

  try {
    const hunspellFactory = await loadModule();

    // Mount English
    const affEn = new Uint8Array(dictionaryEn.aff);
    const dicEn = new Uint8Array(dictionaryEn.dic);
    const affPathEn = hunspellFactory.mountBuffer(affEn, 'en.aff');
    const dicPathEn = hunspellFactory.mountBuffer(dicEn, 'en.dic');

    // Mount Hebrew
    const affHe = new Uint8Array(dictionaryHe.aff);
    const dicHe = new Uint8Array(dictionaryHe.dic);
    const affPathHe = hunspellFactory.mountBuffer(affHe, 'he.aff');
    const dicPathHe = hunspellFactory.mountBuffer(dicHe, 'he.dic');

    // hunspell-asm `create` takes one dictionary pair, so we instantiate EN and HE separately.
    const spellEn = hunspellFactory.create(affPathEn, dicPathEn);
    const spellHe = hunspellFactory.create(affPathHe, dicPathHe);

    spellChecker = {
      correct: (word) => {
        if (/[\u0590-\u05FF]/.test(word)) {
          return spellHe.spell(word);
        }
        return spellEn.spell(word);
      },
      suggest: (word) => {
        if (/[\u0590-\u05FF]/.test(word)) {
          return spellHe.suggest(word);
        }
        return spellEn.suggest(word);
      },
    };

    return spellChecker;
  } catch (e) {
    console.error('Failed to initialize spell checker:', e);
    // Fail gracefully - return an object that always says correct
    return {
      correct: () => true,
      suggest: () => [],
    };
  }
}
