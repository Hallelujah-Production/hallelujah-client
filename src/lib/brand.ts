/** Public product name. Internal cookie/API names stay gundala_*. */
export const PLATFORM_NAME = "Hallelujah";
export const PLATFORM_TAGLINE = "Parish register";
export const PLATFORM_SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "http://localhost:3000";
export const PLATFORM_CONTACT_EMAIL = "hello@hallelujah.app";

/** Same crest as the printed receipt. Always load via this path — never the raw JPEG size. */
export const PLATFORM_LOGO = "/brand/receipt-logo.jpeg";
export const PLATFORM_LOGO_SRC = PLATFORM_LOGO;
export const PLATFORM_LOGO_WIDTH = 72;
export const PLATFORM_LOGO_HEIGHT = 72;
