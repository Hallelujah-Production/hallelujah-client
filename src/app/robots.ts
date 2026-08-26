import type { MetadataRoute } from "next";
import { PLATFORM_SITE_URL } from "@/lib/brand";

const SITE_URL = PLATFORM_SITE_URL;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/about", "/churches", "/church/", "/contact", "/privacy", "/terms"],
        // Church workspaces and platform administration are private. The pages
        // also carry noindex metadata; this is the belt to that pair of braces.
        disallow: [
          "/dashboard",
          "/intentions",
          "/customers",
          "/payments",
          "/receipts",
          "/team",
          "/notifications",
          "/reports",
          "/settings",
          "/my-prayers",
          "/upcoming",
          "/completed",
          "/profile",
          "/super-admin",
          "/login",
          "/setup",
          "/forgot-password",
          "/reset-password",
          "/church/*/prayer/success",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
