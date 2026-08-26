import Link from "next/link";
import { BrandMark } from "@/components/layout/church-mark";

export const metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="flex min-h-dvh min-h-screen flex-col">
      <header className="container flex h-[4.5rem] items-center">
        <Link href="/" className="rounded" aria-label="Hallelujah home">
          <BrandMark size="md" className="lg:hidden" />
          <BrandMark size="md" className="hidden lg:inline-flex" />
        </Link>
      </header>

      <main id="main-content" className="relative flex flex-1 items-center overflow-hidden">
        <div className="aurora absolute inset-0 -z-10" aria-hidden="true" />
        <div className="container py-20 text-center">
          <p className="eyebrow justify-center">404</p>
          <h1 className="mx-auto mt-4 max-w-2xl font-display text-4xl font-semibold tracking-tight text-primary sm:text-5xl">
            We could not find that page.
          </h1>
          <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-muted-foreground">
            The link may be out of date. You can browse the churches on Hallelujah, or head
            back to the home page.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Link
              href="/churches"
              className="inline-flex h-12 items-center rounded-md bg-primary px-6 text-[0.9375rem] font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              Find your church
            </Link>
            <Link
              href="/"
              className="inline-flex h-12 items-center rounded-md border border-input bg-card px-6 text-[0.9375rem] font-medium text-foreground transition-colors hover:bg-muted"
            >
              Home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
