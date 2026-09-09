import type { ReceiptLocale } from "./locales";

type Translated = Record<Exclude<ReceiptLocale, "en">, string>;

/**
 * The platform prayer catalogue, translated. Keyed on `PrayerType.code`, which
 * is stable across parishes even when a Super Admin renames the type — so a
 * parish that calls `THANKSGIVING` "Birthday Thanksgiving" still prints proper
 * Telugu rather than a phonetic spelling of the English name.
 *
 * Codes outside this table fall through to `PRAYER_PHRASES`, then to
 * transliteration. Keep it in step with `prayer-types.seed.ts`.
 */
export const PRAYER_TYPE_NAMES: Record<string, Translated> = {
  BIRTHDAY: {
    te: "పుట్టినరోజు ప్రార్థన",
    hi: "जन्मदिन प्रार्थना",
    mr: "वाढदिवस प्रार्थना",
    ta: "பிறந்தநாள் ஜெபம்",
    kn: "ಹುಟ್ಟುಹಬ್ಬದ ಪ್ರಾರ್ಥನೆ",
    ml: "ജന്മദിന പ്രാർത്ഥന",
  },
  MARRIAGE: {
    te: "వివాహ ప్రార్థన",
    hi: "विवाह प्रार्थना",
    mr: "विवाह प्रार्थना",
    ta: "திருமண ஜெபம்",
    kn: "ವಿವಾಹ ಪ್ರಾರ್ಥನೆ",
    ml: "വിവാഹ പ്രാർത്ഥന",
  },
  ANNIVERSARY: {
    te: "వార్షికోత్సవ ప్రార్థన",
    hi: "वर्षगांठ प्रार्थना",
    mr: "वर्धापन दिन प्रार्थना",
    ta: "ஆண்டுவிழா ஜெபம்",
    kn: "ವಾರ್ಷಿಕೋತ್ಸವ ಪ್ರಾರ್ಥನೆ",
    ml: "വാർഷിക പ്രാർത്ഥന",
  },
  HEALTH: {
    te: "ఆరోగ్యం & స్వస్థత",
    hi: "स्वास्थ्य एवं चंगाई",
    mr: "आरोग्य व बरे होणे",
    ta: "உடல்நலம் & குணமாதல்",
    kn: "ಆರೋಗ್ಯ ಮತ್ತು ಗುಣಮುಖ",
    ml: "ആരോഗ്യവും സൗഖ്യവും",
  },
  THANKSGIVING: {
    te: "కృతజ్ఞతా ప్రార్థన",
    hi: "धन्यवाद प्रार्थना",
    mr: "आभार प्रार्थना",
    ta: "நன்றி ஜெபம்",
    kn: "ಕೃತಜ್ಞತಾ ಪ್ರಾರ್ಥನೆ",
    ml: "നന്ദി പ്രാർത്ഥന",
  },
  MEMORIAL: {
    te: "మృతుల స్మరణ ప్రార్థన",
    hi: "स्मृति प्रार्थना",
    mr: "स्मृती प्रार्थना",
    ta: "நினைவு ஜெபம்",
    kn: "ಸ್ಮರಣಾರ್ಥ ಪ್ರಾರ್ಥನೆ",
    ml: "ഓർമ്മ പ്രാർത്ഥന",
  },
  FAMILY: {
    te: "కుటుంబ ప్రార్థన",
    hi: "परिवार प्रार्थना",
    mr: "कुटुंब प्रार्थना",
    ta: "குடும்ப ஜெபம்",
    kn: "ಕುಟುಂಬ ಪ್ರಾರ್ಥನೆ",
    ml: "കുടുംബ പ്രാർത്ഥന",
  },
  SPECIAL: {
    te: "ప్రత్యేక సంకల్పం",
    hi: "विशेष संकल्प",
    mr: "विशेष संकल्प",
    ta: "சிறப்பு நோக்கம்",
    kn: "ವಿಶೇಷ ಸಂಕಲ್ಪ",
    ml: "പ്രത്യേക നിയോഗം",
  },
  EDUCATION: {
    te: "విద్యా ప్రార్థన",
    hi: "शिक्षा प्रार्थना",
    mr: "शिक्षण प्रार्थना",
    ta: "கல்வி ஜெபம்",
    kn: "ಶಿಕ್ಷಣ ಪ್ರಾರ್ಥನೆ",
    ml: "വിദ്യാഭ്യാസ പ്രാർത്ഥന",
  },
  CAREER: {
    te: "ఉద్యోగ ప్రార్థన",
    hi: "करियर प्रार्थना",
    mr: "करिअर प्रार्थना",
    ta: "பணி ஜெபம்",
    kn: "ವೃತ್ತಿ ಪ್ರಾರ್ಥನೆ",
    ml: "ജോലി പ്രാർത്ഥന",
  },
  TRAVEL: {
    te: "ప్రయాణ ప్రార్థన",
    hi: "यात्रा प्रार्थना",
    mr: "प्रवास प्रार्थना",
    ta: "பயண ஜெபம்",
    kn: "ಪ್ರಯಾಣ ಪ್ರಾರ್ಥನೆ",
    ml: "യാത്രാ പ്രാർത്ഥന",
  },
};

/**
 * Words a parish is likely to type into a custom prayer type or into the
 * "prayer for" line. Matched whole-word and case-insensitively against the
 * English text before transliteration runs, so "Healing Mass" comes out as two
 * translated words rather than two phonetic ones.
 */
export const PRAYER_PHRASES: Record<string, Translated> = {
  prayer: {
    te: "ప్రార్థన", hi: "प्रार्थना", mr: "प्रार्थना",
    ta: "ஜெபம்", kn: "ಪ್ರಾರ್ಥನೆ", ml: "പ്രാർത്ഥന",
  },
  mass: {
    te: "దివ్య పూజ", hi: "मिस्सा", mr: "मिस्सा",
    ta: "திருப்பலி", kn: "ದಿವ್ಯ ಬಲಿಪೂಜೆ", ml: "വിശുദ്ധ കുർബാന",
  },
  novena: {
    te: "నవెన", hi: "नोवेना", mr: "नोव्हेना",
    ta: "நவநாள் ஜெபம்", kn: "ನೊವೆನಾ", ml: "നൊവേന",
  },
  rosary: {
    te: "జపమాల", hi: "माला प्रार्थना", mr: "जपमाळ",
    ta: "செபமாலை", kn: "ಜಪಮಾಲೆ", ml: "ജപമാല",
  },
  healing: {
    te: "స్వస్థత", hi: "चंगाई", mr: "बरे होणे",
    ta: "குணமாதல்", kn: "ಗುಣಮುಖ", ml: "സൗഖ്യം",
  },
  blessing: {
    te: "ఆశీర్వాదం", hi: "आशीर्वाद", mr: "आशीर्वाद",
    ta: "ஆசீர்வாதம்", kn: "ಆಶೀರ್ವಾದ", ml: "അനുഗ്രഹം",
  },
  offering: {
    te: "కానుక", hi: "भेंट", mr: "अर्पण",
    ta: "காணிக்கை", kn: "ಕಾಣಿಕೆ", ml: "കാഴ്ച",
  },
  fasting: {
    te: "ఉపవాసం", hi: "उपवास", mr: "उपवास",
    ta: "உபவாசம்", kn: "ಉಪವಾಸ", ml: "ഉപവാസം",
  },
  peace: {
    te: "శాంతి", hi: "शांति", mr: "शांती",
    ta: "அமைதி", kn: "ಶಾಂತಿ", ml: "സമാധാനം",
  },
  protection: {
    te: "రక్షణ", hi: "सुरक्षा", mr: "संरक्षण",
    ta: "பாதுகாப்பு", kn: "ರಕ್ಷಣೆ", ml: "സംരക്ഷണം",
  },
  health: {
    te: "ఆరోగ్యం", hi: "स्वास्थ्य", mr: "आरोग्य",
    ta: "உடல்நலம்", kn: "ಆರೋಗ್ಯ", ml: "ആരോഗ്യം",
  },
  family: {
    te: "కుటుంబం", hi: "परिवार", mr: "कुटुंब",
    ta: "குடும்பம்", kn: "ಕುಟುಂಬ", ml: "കുടുംബം",
  },
  special: {
    te: "ప్రత్యేక", hi: "विशेष", mr: "विशेष",
    ta: "சிறப்பு", kn: "ವಿಶೇಷ", ml: "പ്രത്യേക",
  },
  intention: {
    te: "సంకల్పం", hi: "संकल्प", mr: "संकल्प",
    ta: "நோக்கம்", kn: "ಸಂಕಲ್ಪ", ml: "നിയോഗം",
  },
  thanksgiving: {
    te: "కృతజ్ఞత", hi: "धन्यवाद", mr: "आभार",
    ta: "நன்றி", kn: "ಕೃತಜ್ಞತೆ", ml: "നന്ദി",
  },
  memorial: {
    te: "స్మరణ", hi: "स्मृति", mr: "स्मृती",
    ta: "நினைவு", kn: "ಸ್ಮರಣೆ", ml: "ഓർമ്മ",
  },
  birthday: {
    te: "పుట్టినరోజు", hi: "जन्मदिन", mr: "वाढदिवस",
    ta: "பிறந்தநாள்", kn: "ಹುಟ್ಟುಹಬ್ಬ", ml: "ജന്മദിനം",
  },
  marriage: {
    te: "వివాహం", hi: "विवाह", mr: "विवाह",
    ta: "திருமணம்", kn: "ವಿವಾಹ", ml: "വിവാഹം",
  },
  wedding: {
    te: "వివాహం", hi: "विवाह", mr: "विवाह",
    ta: "திருமணம்", kn: "ವಿವಾಹ", ml: "വിവാഹം",
  },
  anniversary: {
    te: "వార్షికోత్సవం", hi: "वर्षगांठ", mr: "वर्धापन दिन",
    ta: "ஆண்டுவிழா", kn: "ವಾರ್ಷಿಕೋತ್ಸವ", ml: "വാർഷികം",
  },
  education: {
    te: "విద్య", hi: "शिक्षा", mr: "शिक्षण",
    ta: "கல்வி", kn: "ಶಿಕ್ಷಣ", ml: "വിദ്യാഭ്യാസം",
  },
  career: {
    te: "ఉద్యోగం", hi: "करियर", mr: "करिअर",
    ta: "பணி", kn: "ವೃತ್ತಿ", ml: "ജോലി",
  },
  travel: {
    te: "ప్రయాణం", hi: "यात्रा", mr: "प्रवास",
    ta: "பயணம்", kn: "ಪ್ರಯಾಣ", ml: "യാത്ര",
  },
  exam: {
    te: "పరీక్ష", hi: "परीक्षा", mr: "परीक्षा",
    ta: "தேர்வு", kn: "ಪರೀಕ್ಷೆ", ml: "പരീക്ഷ",
  },
  surgery: {
    te: "శస్త్రచికిత్స", hi: "शल्यक्रिया", mr: "शस्त्रक्रिया",
    ta: "அறுவை சிகிச்சை", kn: "ಶಸ್ತ್ರಚಿಕಿತ್ಸೆ", ml: "ശസ്ത്രക്രിയ",
  },
  soul: {
    te: "ఆత్మ", hi: "आत्मा", mr: "आत्मा",
    ta: "ஆன்மா", kn: "ಆತ್ಮ", ml: "ആത്മാവ്",
  },
  departed: {
    te: "మృతులు", hi: "दिवंगत", mr: "दिवंगत",
    ta: "மறைந்தவர்", kn: "ಮೃತರು", ml: "മരിച്ചവർ",
  },
  and: {
    te: "మరియు", hi: "और", mr: "आणि",
    ta: "மற்றும்", kn: "ಮತ್ತು", ml: "ഒപ്പം",
  },
  for: {
    te: "కోసం", hi: "के लिए", mr: "साठी",
    ta: "காக", kn: "ಗಾಗಿ", ml: "വേണ്ടി",
  },
};

export function translatedPrayerTypeName(
  code: string | undefined,
  locale: ReceiptLocale,
): string | null {
  if (!code || locale === "en") return null;
  return PRAYER_TYPE_NAMES[code.toUpperCase()]?.[locale] ?? null;
}

export function translatedPhrase(word: string, locale: ReceiptLocale): string | null {
  if (locale === "en") return null;
  return PRAYER_PHRASES[word.toLowerCase()]?.[locale] ?? null;
}
