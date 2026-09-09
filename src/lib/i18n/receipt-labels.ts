import type { ReceiptLocale } from "./locales";

/**
 * Every fixed string that reaches the thermal roll. Values are real
 * translations, not transliterations — a parishioner reading Telugu should see
 * "అధికారిక రసీదు", never "ఆఫీషియల్ రసీప్ట్".
 *
 * Amounts, receipt numbers, mobile numbers and dates keep Latin digits in all
 * languages: the counter reconciles them against the register by eye, and
 * native digit glyphs make that error-prone.
 */
export interface ReceiptLabels {
  officialReceipt: string;
  prayerIntention: string;
  receivedFrom: string;
  name: string;
  mobile: string;
  prayerFor: string;
  prayerDate: string;
  requestedBy: string;
  payment: string;
  method: string;
  description: string;
  totalReceived: string;
  status: string;
  receivedBy: string;
  thanks: string;
  parishOffice: string;
  statusPending: string;
  statusVerified: string;
  statusRejected: string;
  methodCash: string;
  methodUpi: string;
  /** Three-letter month names, January first. */
  months: readonly string[];
}

/**
 * Exactly what `Intl` produces for `en-IN` — note "Sept", not "Sep". Copied
 * rather than derived so an English receipt prints character for character the
 * same as it did before the language picker existed.
 */
const EN_MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sept", "Oct", "Nov", "Dec",
] as const;

export const RECEIPT_LABELS: Record<ReceiptLocale, ReceiptLabels> = {
  en: {
    officialReceipt: "Official receipt",
    prayerIntention: "Prayer intention",
    receivedFrom: "Received from",
    name: "Name",
    mobile: "Mobile",
    prayerFor: "Prayer for",
    prayerDate: "Prayer date",
    requestedBy: "Requested by",
    payment: "Payment",
    method: "Method",
    description: "Description",
    totalReceived: "Total received",
    status: "Status",
    receivedBy: "Received By",
    thanks: "Thank you for your\nprayer intention!",
    parishOffice: "Parish office",
    statusPending: "PENDING",
    statusVerified: "VERIFIED",
    statusRejected: "REJECTED",
    methodCash: "Cash",
    methodUpi: "UPI / PhonePe",
    months: EN_MONTHS,
  },

  te: {
    officialReceipt: "అధికారిక రసీదు",
    prayerIntention: "ప్రార్థన సంకల్పం",
    receivedFrom: "వీరి నుండి స్వీకరించబడింది",
    name: "పేరు",
    mobile: "మొబైల్",
    prayerFor: "ఎవరి కోసం",
    prayerDate: "ప్రార్థన తేదీ",
    requestedBy: "అభ్యర్థించినవారు",
    payment: "చెల్లింపు",
    method: "విధానం",
    description: "వివరణ",
    totalReceived: "స్వీకరించిన మొత్తం",
    status: "స్థితి",
    receivedBy: "స్వీకరించినవారు",
    thanks: "మీ ప్రార్థన సంకల్పానికి\nధన్యవాదాలు!",
    parishOffice: "పారిష్ కార్యాలయం",
    statusPending: "పెండింగ్",
    statusVerified: "ధృవీకరించబడింది",
    statusRejected: "తిరస్కరించబడింది",
    methodCash: "నగదు",
    methodUpi: "యూపీఐ / ఫోన్‌పే",
    months: [
      "జన", "ఫిబ్ర", "మార్చి", "ఏప్రి", "మే", "జూన్",
      "జూలై", "ఆగ", "సెప్టెం", "అక్టో", "నవం", "డిసెం",
    ],
  },

  hi: {
    officialReceipt: "आधिकारिक रसीद",
    prayerIntention: "प्रार्थना संकल्प",
    receivedFrom: "इनसे प्राप्त",
    name: "नाम",
    mobile: "मोबाइल",
    prayerFor: "किसके लिए",
    prayerDate: "प्रार्थना तिथि",
    requestedBy: "अनुरोधकर्ता",
    payment: "भुगतान",
    method: "माध्यम",
    description: "विवरण",
    totalReceived: "कुल प्राप्त राशि",
    status: "स्थिति",
    receivedBy: "प्राप्तकर्ता",
    thanks: "आपके प्रार्थना संकल्प के लिए\nधन्यवाद!",
    parishOffice: "पैरिश कार्यालय",
    statusPending: "लंबित",
    statusVerified: "सत्यापित",
    statusRejected: "अस्वीकृत",
    methodCash: "नकद",
    methodUpi: "यूपीआई / फोनपे",
    months: [
      "जन", "फर", "मार्च", "अप्रै", "मई", "जून",
      "जुल", "अग", "सित", "अक्टू", "नव", "दिस",
    ],
  },

  mr: {
    officialReceipt: "अधिकृत पावती",
    prayerIntention: "प्रार्थना संकल्प",
    receivedFrom: "यांच्याकडून प्राप्त",
    name: "नाव",
    mobile: "मोबाइल",
    prayerFor: "कोणासाठी",
    prayerDate: "प्रार्थना दिनांक",
    requestedBy: "विनंती करणारे",
    payment: "देयक",
    method: "पद्धत",
    description: "तपशील",
    totalReceived: "एकूण प्राप्त रक्कम",
    status: "स्थिती",
    receivedBy: "स्वीकारणारे",
    thanks: "तुमच्या प्रार्थना संकल्पासाठी\nधन्यवाद!",
    parishOffice: "पॅरिश कार्यालय",
    statusPending: "प्रलंबित",
    statusVerified: "पडताळणी झाली",
    statusRejected: "नाकारले",
    methodCash: "रोख",
    methodUpi: "यूपीआय / फोनपे",
    months: [
      "जाने", "फेब्रु", "मार्च", "एप्रि", "मे", "जून",
      "जुलै", "ऑग", "सप्टें", "ऑक्टो", "नोव्हें", "डिसें",
    ],
  },

  ta: {
    officialReceipt: "அதிகாரப்பூர்வ ரசீது",
    prayerIntention: "ஜெப நோக்கம்",
    receivedFrom: "இவர்களிடமிருந்து பெறப்பட்டது",
    name: "பெயர்",
    mobile: "கைபேசி",
    prayerFor: "யாருக்காக",
    prayerDate: "ஜெப தேதி",
    requestedBy: "கோரியவர்",
    payment: "கட்டணம்",
    method: "முறை",
    description: "விவரம்",
    totalReceived: "பெறப்பட்ட மொத்தத் தொகை",
    status: "நிலை",
    receivedBy: "பெற்றவர்",
    thanks: "உங்கள் ஜெப நோக்கத்திற்கு\nநன்றி!",
    parishOffice: "பங்கு அலுவலகம்",
    statusPending: "நிலுவையில்",
    statusVerified: "சரிபார்க்கப்பட்டது",
    statusRejected: "நிராகரிக்கப்பட்டது",
    methodCash: "ரொக்கம்",
    methodUpi: "யுபிஐ / போன்பே",
    months: [
      "ஜன", "பிப்", "மார்", "ஏப்", "மே", "ஜூன்",
      "ஜூலை", "ஆக", "செப்", "அக்", "நவ", "டிச",
    ],
  },

  kn: {
    officialReceipt: "ಅಧಿಕೃತ ರಸೀದಿ",
    prayerIntention: "ಪ್ರಾರ್ಥನಾ ಸಂಕಲ್ಪ",
    receivedFrom: "ಇವರಿಂದ ಸ್ವೀಕರಿಸಲಾಗಿದೆ",
    name: "ಹೆಸರು",
    mobile: "ಮೊಬೈಲ್",
    prayerFor: "ಯಾರಿಗಾಗಿ",
    prayerDate: "ಪ್ರಾರ್ಥನೆ ದಿನಾಂಕ",
    requestedBy: "ವಿನಂತಿಸಿದವರು",
    payment: "ಪಾವತಿ",
    method: "ವಿಧಾನ",
    description: "ವಿವರಣೆ",
    totalReceived: "ಸ್ವೀಕರಿಸಿದ ಒಟ್ಟು ಮೊತ್ತ",
    status: "ಸ್ಥಿತಿ",
    receivedBy: "ಸ್ವೀಕರಿಸಿದವರು",
    thanks: "ನಿಮ್ಮ ಪ್ರಾರ್ಥನಾ ಸಂಕಲ್ಪಕ್ಕೆ\nಧನ್ಯವಾದಗಳು!",
    parishOffice: "ಪ್ಯಾರಿಷ್ ಕಚೇರಿ",
    statusPending: "ಬಾಕಿ ಇದೆ",
    statusVerified: "ಪರಿಶೀಲಿಸಲಾಗಿದೆ",
    statusRejected: "ತಿರಸ್ಕರಿಸಲಾಗಿದೆ",
    methodCash: "ನಗದು",
    methodUpi: "ಯುಪಿಐ / ಫೋನ್‌ಪೇ",
    months: [
      "ಜನ", "ಫೆಬ್ರ", "ಮಾರ್ಚ್", "ಏಪ್ರಿ", "ಮೇ", "ಜೂನ್",
      "ಜುಲೈ", "ಆಗ", "ಸೆಪ್ಟೆಂ", "ಅಕ್ಟೋ", "ನವೆಂ", "ಡಿಸೆಂ",
    ],
  },

  ml: {
    officialReceipt: "ഔദ്യോഗിക രസീത്",
    prayerIntention: "പ്രാർത്ഥനാ നിയോഗം",
    receivedFrom: "ഇവരിൽ നിന്ന് ലഭിച്ചു",
    name: "പേര്",
    mobile: "മൊബൈൽ",
    prayerFor: "ആർക്കുവേണ്ടി",
    prayerDate: "പ്രാർത്ഥനാ തീയതി",
    requestedBy: "അപേക്ഷിച്ചത്",
    payment: "പേയ്‌മെന്റ്",
    method: "രീതി",
    description: "വിവരണം",
    totalReceived: "ആകെ ലഭിച്ച തുക",
    status: "നില",
    receivedBy: "സ്വീകരിച്ചത്",
    thanks: "നിങ്ങളുടെ പ്രാർത്ഥനാ നിയോഗത്തിന്\nനന്ദി!",
    parishOffice: "ഇടവക ഓഫീസ്",
    statusPending: "തീർപ്പാക്കാത്തത്",
    statusVerified: "പരിശോധിച്ചു",
    statusRejected: "നിരസിച്ചു",
    methodCash: "പണം",
    methodUpi: "യുപിഐ / ഫോൺപേ",
    months: [
      "ജനു", "ഫെബ്രു", "മാർ", "ഏപ്രി", "മെയ്", "ജൂൺ",
      "ജൂലൈ", "ഓഗ", "സെപ്റ്റം", "ഒക്ടോ", "നവം", "ഡിസം",
    ],
  },
};

export function receiptLabels(locale: ReceiptLocale): ReceiptLabels {
  return RECEIPT_LABELS[locale] ?? RECEIPT_LABELS.en;
}
