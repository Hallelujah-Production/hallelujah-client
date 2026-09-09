import { localeScript, type ReceiptLocale, type ReceiptScript } from "./locales";

/**
 * Phonetic conversion of Latin-script text into an Indic script.
 *
 * This is *transliteration*, not translation: it changes the script, not the
 * meaning, so "Ramesh Kumar" becomes "రమేష్ కుమార్" and stays the same name.
 * It exists because a receipt printed for an elderly parishioner should be
 * readable end to end, and names can never be translated — only respelled.
 *
 * Meaning-bearing words are handled first by `prayer-terms.ts`; whatever falls
 * through reaches here. Digits and punctuation pass straight through, which is
 * what keeps amounts, receipt numbers and phone numbers in Latin figures.
 *
 * Devanagari, Telugu, Kannada and Malayalam share the ISCII-derived Unicode
 * layout, so one table in Devanagari code points plus a fixed offset covers
 * four of the six scripts. Tamil omits the voiced and aspirated stops and so
 * needs its own table.
 */

const SCRIPT_OFFSET: Record<Exclude<ReceiptScript, "latin" | "tamil">, number> = {
  devanagari: 0x000,
  telugu: 0x300,
  kannada: 0x380,
  malayalam: 0x400,
};

const VIRAMA = 0x094d;
const ANUSVARA = 0x0902;

interface Consonant {
  /** Devanagari code point; offset for Telugu, Kannada and Malayalam. */
  dev: number;
  /** Tamil has no voiced or aspirated series, so several keys share a letter. */
  ta: number;
  /**
   * Devanagari's own letter where it disagrees with the southern scripts.
   * Hindi writes रमेश with श, while Telugu, Kannada, Malayalam and Tamil all
   * use the ष series for the same sound.
   */
  devanagari?: number;
  /** Consonant written before this one with a virama, forming a conjunct. */
  pre?: number;
}

/** Longest key wins, so "ch" is matched before "c" and "aa" before "a". */
const CONSONANTS: Record<string, Consonant> = {
  kh: { dev: 0x0916, ta: 0x0b95 },
  gh: { dev: 0x0918, ta: 0x0b95 },
  ng: { dev: 0x0919, ta: 0x0b99 },
  chh: { dev: 0x091b, ta: 0x0b9a },
  ch: { dev: 0x091a, ta: 0x0b9a },
  jh: { dev: 0x091d, ta: 0x0b9c },
  ny: { dev: 0x091e, ta: 0x0b9e },
  th: { dev: 0x0925, ta: 0x0ba4 },
  dh: { dev: 0x0927, ta: 0x0ba4 },
  ph: { dev: 0x092b, ta: 0x0baa },
  bh: { dev: 0x092d, ta: 0x0baa },
  // ష, not శ: "Ramesh" and "Suresh" are written రమేష్ / సురేష్.
  sh: { dev: 0x0937, devanagari: 0x0936, ta: 0x0bb7 },
  // Its own key so "Lakshmi" forms the లక్ష్మి / लक्ष्मी conjunct rather than
  // being split into a bare k and a sh.
  ksh: { dev: 0x0937, ta: 0x0bb7, pre: 0x0915 },
  zh: { dev: 0x0932, ta: 0x0bb4 },
  k: { dev: 0x0915, ta: 0x0b95 },
  g: { dev: 0x0917, ta: 0x0b95 },
  j: { dev: 0x091c, ta: 0x0b9c },
  t: { dev: 0x091f, ta: 0x0b9f },
  d: { dev: 0x0921, ta: 0x0b9f },
  n: { dev: 0x0928, ta: 0x0ba8 },
  p: { dev: 0x092a, ta: 0x0baa },
  b: { dev: 0x092c, ta: 0x0baa },
  m: { dev: 0x092e, ta: 0x0bae },
  y: { dev: 0x092f, ta: 0x0baf },
  r: { dev: 0x0930, ta: 0x0bb0 },
  l: { dev: 0x0932, ta: 0x0bb2 },
  v: { dev: 0x0935, ta: 0x0bb5 },
  w: { dev: 0x0935, ta: 0x0bb5 },
  s: { dev: 0x0938, ta: 0x0bb8 },
  h: { dev: 0x0939, ta: 0x0bb9 },
  f: { dev: 0x092b, ta: 0x0baa },
  z: { dev: 0x091c, ta: 0x0b9c },
};

interface Vowel {
  /** Independent form, used at the start of a syllable. */
  dev: number;
  /** Dependent sign. `null` for the inherent vowel, which writes nothing. */
  devSign: number | null;
  ta: number;
  taSign: number | null;
}

const VOWELS: Record<string, Vowel> = {
  aa: { dev: 0x0906, devSign: 0x093e, ta: 0x0b86, taSign: 0x0bbe },
  ai: { dev: 0x0910, devSign: 0x0948, ta: 0x0b90, taSign: 0x0bc8 },
  au: { dev: 0x0914, devSign: 0x094c, ta: 0x0b94, taSign: 0x0bcc },
  ee: { dev: 0x0908, devSign: 0x0940, ta: 0x0b88, taSign: 0x0bc0 },
  ea: { dev: 0x0908, devSign: 0x0940, ta: 0x0b88, taSign: 0x0bc0 },
  ie: { dev: 0x0908, devSign: 0x0940, ta: 0x0b88, taSign: 0x0bc0 },
  ei: { dev: 0x090f, devSign: 0x0947, ta: 0x0b8f, taSign: 0x0bc7 },
  oo: { dev: 0x090a, devSign: 0x0942, ta: 0x0b8a, taSign: 0x0bc2 },
  ou: { dev: 0x0914, devSign: 0x094c, ta: 0x0b94, taSign: 0x0bcc },
  uu: { dev: 0x090a, devSign: 0x0942, ta: 0x0b8a, taSign: 0x0bc2 },
  a: { dev: 0x0905, devSign: null, ta: 0x0b85, taSign: null },
  i: { dev: 0x0907, devSign: 0x093f, ta: 0x0b87, taSign: 0x0bbf },
  u: { dev: 0x0909, devSign: 0x0941, ta: 0x0b89, taSign: 0x0bc1 },
  e: { dev: 0x090f, devSign: 0x0947, ta: 0x0b8f, taSign: 0x0bc7 },
  o: { dev: 0x0913, devSign: 0x094b, ta: 0x0b93, taSign: 0x0bcb },
};

const CONSONANT_KEYS = Object.keys(CONSONANTS).sort((a, b) => b.length - a.length);
const VOWEL_KEYS = Object.keys(VOWELS).sort((a, b) => b.length - a.length);

/**
 * Malayalam writes a word-final consonant as a chillu letter rather than as a
 * base letter plus chandrakkala. Skipping this is legible but looks wrong to a
 * native reader, and names end in these consonants constantly.
 */
const MALAYALAM_CHILLU: Record<number, number> = {
  0x0928: 0x0d7b, // n
  0x0930: 0x0d7c, // r
  0x0932: 0x0d7d, // l
};

/**
 * English spelling quirks that would otherwise be read letter by letter.
 * Applied before parsing so the syllable walker only ever sees keys it knows.
 */
function normalizeRoman(word: string): string {
  return word
    .toLowerCase()
    .replace(/x/g, "ks")
    .replace(/qu/g, "kw")
    .replace(/q/g, "k")
    .replace(/ck/g, "k")
    .replace(/c([eiy])/g, "s$1")
    .replace(/c(?!h)/g, "k") // "ch" is a digraph in CONSONANTS; a bare "c" is /k/
    .replace(/wh/g, "w")
    // A word-final "y" after a consonant is the vowel /i/, not the glide:
    // Jessy, Mary, Shiny.
    .replace(/([bcdfghjklmnpqrstvwxz])y$/, "$1i")
    // English "magic e" lengthens the vowel two letters back: Grace, Jane,
    // Mike. Without this the silent-e rule alone leaves "grace" as గ్రస్.
    .replace(/a([bdfgklmnprstvz])e$/, "ei$1")
    .replace(/i([bdfgklmnprstvz])e$/, "ai$1");
}

function matchAt(keys: string[], text: string, index: number): string | null {
  for (const key of keys) {
    if (text.startsWith(key, index)) return key;
  }
  return null;
}

function devChar(code: number, offset: number): string {
  return String.fromCharCode(code + offset);
}

/**
 * An anusvara stands in for a nasal only before a stop — Anand is అనంద్. Before
 * another nasal, a semivowel or a sibilant the nasal keeps its own letter, so
 * Kannan stays కన్నన్ instead of collapsing to కంనన్.
 */
const STOPS = new Set([
  "k", "kh", "g", "gh", "ch", "chh", "j", "jh",
  "t", "th", "d", "dh", "p", "ph", "b", "bh",
]);

/** True when a consonant — not a vowel — begins at `index`. */
function consonantAt(text: string, index: number): boolean {
  if (index >= text.length) return false;
  if (matchAt(VOWEL_KEYS, text, index)) return false;
  return matchAt(CONSONANT_KEYS, text, index) !== null;
}

function transliterateWord(word: string, script: ReceiptScript): string {
  const tamil = script === "tamil";
  const offset = tamil ? 0 : SCRIPT_OFFSET[script as keyof typeof SCRIPT_OFFSET];
  const src = normalizeRoman(word);
  const out: string[] = [];

  let i = 0;
  while (i < src.length) {
    const cKey = matchAt(CONSONANT_KEYS, src, i);

    if (cKey) {
      const consonant = CONSONANTS[cKey];
      i += cKey.length;

      // "n"/"m" closing a syllable before another consonant is a nasal sign,
      // not a full letter: Anand → అనంద్, not అన్అంద్.
      // Tamil is excluded: it has no anusvara, and forcing ம் in front of a
      // dental or retroflex writes a nasal the word does not have.
      const nextKey = consonantAt(src, i) ? matchAt(CONSONANT_KEYS, src, i) : null;

      const nasal = cKey === "n" || cKey === "m";
      if (!tamil && nasal && out.length > 0 && nextKey && STOPS.has(nextKey)) {
        out.push(devChar(ANUSVARA, offset));
        continue;
      }

      let vKey = matchAt(VOWEL_KEYS, src, i);

      // Silent final "e": Grace, Rose, Jose. Without this every English name
      // picks up a trailing vowel it does not have.
      if (vKey === "e" && i + 1 === src.length && src.length > 3) {
        i += 1; // consume it, or the next pass writes it as a standalone vowel
        vKey = null;
      } else if (vKey) {
        i += vKey.length;
      }

      const dev = (script === "devanagari" && consonant.devanagari) || consonant.dev;
      const base = tamil ? consonant.ta : dev + offset;
      const atEnd = i >= src.length;

      if (consonant.pre !== undefined) {
        out.push(
          String.fromCharCode(tamil ? 0x0b95 : consonant.pre + offset),
          tamil ? String.fromCharCode(0x0bcd) : devChar(VIRAMA, offset),
        );
      }

      if (!vKey && script === "malayalam") {
        const chillu = MALAYALAM_CHILLU[consonant.dev];
        // Mid-word, only a lone "r" or "l" takes a chillu. A doubled one is a
        // geminate that must ligate — Vallikkavu is വല്ലിക്കവു, not വൽലിക്കവു.
        const medial = (cKey === "r" || cKey === "l") && nextKey !== cKey;
        if (chillu && (atEnd || medial)) {
          out.push(String.fromCharCode(chillu));
          continue;
        }
      }
      if (!vKey && atEnd && tamil && cKey === "n") {
        out.push(String.fromCharCode(0x0ba9), String.fromCharCode(0x0bcd));
        continue;
      }

      out.push(String.fromCharCode(base));

      if (!vKey) {
        out.push(tamil ? String.fromCharCode(0x0bcd) : devChar(VIRAMA, offset));
      } else {
        const vowel = VOWELS[vKey];
        const sign = tamil ? vowel.taSign : vowel.devSign;
        if (sign !== null) {
          out.push(String.fromCharCode(tamil ? sign : sign + offset));
        }
      }
      continue;
    }

    const vKey = matchAt(VOWEL_KEYS, src, i);
    if (vKey) {
      const vowel = VOWELS[vKey];
      out.push(String.fromCharCode(tamil ? vowel.ta : vowel.dev + offset));
      i += vKey.length;
      continue;
    }

    out.push(src[i]);
    i += 1;
  }

  return out.join("");
}

/**
 * Text a parish already typed in an Indic script is left exactly as it is —
 * respelling it phonetically would only corrupt it. The range covers
 * Devanagari through Sinhala, which spans every script this receipt supports.
 */
function alreadyIndic(text: string): boolean {
  return /[\u0900-\u0DFF]/.test(text);
}

/**
 * Respells Latin-script text in the locale's script. Anything that is not a
 * Latin letter — digits, ₹, punctuation, text already in an Indic script — is
 * returned untouched.
 */
export function transliterate(text: string, locale: ReceiptLocale): string {
  const script = localeScript(locale);
  if (script === "latin" || !text) return text;
  if (alreadyIndic(text)) return text;

  return text.replace(/[A-Za-z]+/g, (word) => transliterateWord(word, script));
}
