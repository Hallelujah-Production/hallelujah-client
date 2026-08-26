import type { StaticImageData } from "next/image";
import churchLogo2 from "@/app/(public)/church logo2.png";

/** Public product name. Internal cookie/API names stay gundala_*. */
export const PLATFORM_NAME = "Hallelujah";
export const PLATFORM_TAGLINE = "Parish register";
export const PLATFORM_SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "http://localhost:3000";
export const PLATFORM_CONTACT_EMAIL = "hello@hallelujah.app";

/** The only platform crest: `Client/src/app/(public)/church logo2.png`. */
export const PLATFORM_LOGO: StaticImageData = churchLogo2;
export const PLATFORM_LOGO_SRC = churchLogo2;
export const PLATFORM_LOGO_WIDTH = churchLogo2.width;
export const PLATFORM_LOGO_HEIGHT = churchLogo2.height;
