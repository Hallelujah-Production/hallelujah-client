import Link from "next/link";
import { BrandMark } from "@/components/layout/church-mark";

const COLUMNS = [
  {
    heading: "Platform",
    links: [
      { label: "About", href: "/about" },
      { label: "Churches", href: "/churches" },
      { label: "How it works", href: "/#how-it-works" },
      { label: "Prayer services", href: "/#services" },
    ],
  },
  {
    heading: "For churches",
    links: [
      { label: "Contact us", href: "/contact" },
      { label: "Church login", href: "/login" },
      { label: "Receipts & records", href: "/#trust" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer data-print="hide" className="border-t border-border bg-card">
      <div className="container py-14">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_2fr]">
          <div className="space-y-4">
            <BrandMark size="md" className="lg:hidden" />
            <BrandMark size="lg" className="hidden lg:inline-flex" />
            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
              Hallelujah brings a parish&apos;s prayer intention register online — the same
              trusted process your church already follows, kept clear and searchable for
              everyone involved.
            </p>
            <p className="max-w-sm rounded-md border border-border bg-muted/50 px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
              Offerings are paid directly to the church and recorded here. Hallelujah does not
              collect money and integrates no payment gateway.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            {COLUMNS.map((column) => (
              <div key={column.heading}>
                <h2 className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  {column.heading}
                </h2>
                <ul className="mt-3.5 space-y-2.5">
                  {column.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-sm text-foreground/80 transition-colors hover:text-primary"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-border pt-6 sm:flex-row sm:items-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Hallelujah. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Made for parishes in Andhra Pradesh and beyond.
          </p>
        </div>
      </div>
    </footer>
  );
}
