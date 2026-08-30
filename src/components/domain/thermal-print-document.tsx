"use client";

import * as React from "react";

/** 96 CSS pixels = 1in = 25.4mm. */
const PX_PER_MM = 96 / 25.4;

/**
 * Chrome ignores `@page { size: 80mm auto }` and falls back to Letter/A4.
 * Measure the receipt and write an explicit content height instead — never a
 * fixed 150mm, 200mm, or 297mm page.
 */
function receiptHeightMm(): number | null {
  const area = document.querySelector<HTMLElement>('[data-print="area"]');
  if (!area) return null;
  const px = Math.max(area.scrollHeight, area.getBoundingClientRect().height);
  if (px <= 0) return null;
  return Math.max(50, Math.ceil(px / PX_PER_MM) + 2);
}

function printCss(heightMm: number | null): string {
  const size = heightMm ? `80mm ${heightMm}mm` : "80mm auto";
  return `
    @media print {
      @page {
        size: ${size};
        margin: 0;
      }
      html,
      body {
        width: 80mm !important;
        max-width: 80mm !important;
      }
      main {
        width: 80mm !important;
        max-width: 80mm !important;
      }
    }
  `;
}

/**
 * Scopes the browser print page box to an 80mm thermal roll for this screen
 * only. Reports and other prints keep the default A4 @page in globals.css.
 * The rule is appended last in <head> so it wins over the A4 default.
 */
export function ThermalPrintDocument() {
  const styleRef = React.useRef<HTMLStyleElement | null>(null);

  const apply = React.useCallback(() => {
    document.documentElement.setAttribute("data-print-mode", "thermal");
    const next = printCss(receiptHeightMm());
    if (styleRef.current) styleRef.current.textContent = next;
  }, []);

  React.useLayoutEffect(() => {
    const el = document.createElement("style");
    el.setAttribute("data-thermal-print", "true");
    document.head.appendChild(el);
    styleRef.current = el;
    apply();

    window.addEventListener("beforeprint", apply);

    const area = document.querySelector('[data-print="area"]');
    const images = area ? Array.from(area.querySelectorAll("img")) : [];
    images.forEach((img) => {
      if (!img.complete) img.addEventListener("load", apply);
    });

    return () => {
      document.documentElement.removeAttribute("data-print-mode");
      window.removeEventListener("beforeprint", apply);
      images.forEach((img) => img.removeEventListener("load", apply));
      el.remove();
      styleRef.current = null;
    };
  }, [apply]);

  return null;
}
