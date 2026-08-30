import type { Metadata } from "next";
import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { Great_Vibes, Playfair_Display } from "next/font/google";
import { Leaf, ShieldCheck, Users } from "lucide-react";
import {
  PLATFORM_LOGO,
  PLATFORM_LOGO_HEIGHT,
  PLATFORM_LOGO_WIDTH,
  PLATFORM_NAME,
} from "@/lib/brand";
import { assertSetupOpen } from "@/app/actions/setup";
import { GoldCross, OliveCorner } from "./setup-ornaments";
import { SetupForm } from "./setup-form";
import styles from "./setup.module.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap",
  variable: "--font-setup-serif",
});

const script = Great_Vibes({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  variable: "--font-setup-script",
});

export const metadata: Metadata = {
  title: "Initial setup",
  description: "Create the first platform administrator.",
  robots: { index: false, follow: false, nocache: true },
};

export default async function SuperAdminSetupPage() {
  await assertSetupOpen();

  return (
    <div className={`${styles.page} ${playfair.variable} ${script.variable}`}>
      <div className={styles.wash} aria-hidden="true" />
      <OliveCorner className={`${styles.leaf} -left-8 -top-10`} />
      <OliveCorner className={`${styles.leaf} -left-4 bottom-0 rotate-[-8deg]`} />
      <OliveCorner className={`${styles.leaf} -right-10 -top-8 rotate-90`} />

      <div className={styles.inner} id="main-content">
        <header className={styles.header}>
          <Link href="/" className={styles.logoWrap} aria-label={`${PLATFORM_NAME} home`}>
            <Image
              src={PLATFORM_LOGO}
              alt=""
              width={PLATFORM_LOGO_WIDTH}
              height={PLATFORM_LOGO_HEIGHT}
              unoptimized
              priority
              className="relative h-[4.5rem] w-[4.5rem] rounded-2xl object-contain"
            />
          </Link>
          <p className={`${styles.script} mt-1.5 text-[2.4rem] leading-none text-primary`}>
            {PLATFORM_NAME}
          </p>
          <p className="mt-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-primary">
            Pray · Offer · Serve
          </p>
          <p className={`${styles.script} mt-0.5 text-[1.45rem] leading-none text-accent`}>
            Together in His Grace
          </p>
        </header>

        <div className={styles.grid}>
          <section className="order-3 flex flex-col justify-center gap-4 lg:order-1">
            <div>
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-accent">
                Welcome to —
              </p>
              <h2 className={`${styles.serif} mt-1 text-[2rem] font-semibold leading-none text-primary`}>
                {PLATFORM_NAME}
              </h2>
              <p className={`${styles.serif} mt-2 text-lg leading-snug text-primary`}>
                Let&apos;s build something <span className="text-secondary">faithful</span> and lasting.
              </p>
              <p className="mt-3 flex items-center gap-3 text-accent" aria-hidden="true">
                <span className="h-px flex-1 max-w-[3.5rem] bg-accent/50" />
                <GoldCross className="h-3 w-3" />
                <span className="h-px flex-1 max-w-[3.5rem] bg-accent/50" />
              </p>
            </div>

            <ul className="space-y-3">
              <Feature
                icon={<ShieldCheck className="h-3.5 w-3.5" />}
                title="Secure & Private"
                text="Your data is encrypted and kept safe always."
              />
              <Feature
                icon={<Users className="h-3.5 w-3.5" />}
                title="For Your Parish"
                text="Designed exclusively for churches and parish communities."
              />
              <Feature
                icon={<Leaf className="h-3.5 w-3.5" />}
                title="Grow Together"
                text="Manage, connect and serve with faith and love."
              />
            </ul>

            <blockquote className="pt-1">
              <p className={`${styles.serif} text-[0.95rem] italic leading-snug text-primary`}>
                “I can do all things through Christ who strengthens me.”
              </p>
              <footer className="mt-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-accent">
                Philippians 4:13
              </footer>
            </blockquote>
          </section>

          <section className="order-1 flex min-h-0 items-start lg:order-2">
            <div className="w-full rounded-2xl border border-black/5 bg-white px-6 py-5 shadow-lg">
              <p className="text-center text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-accent">
                ✦ One-time setup
              </p>
              <h1 className={`${styles.serif} mt-1.5 text-center text-[1.55rem] font-semibold leading-tight text-primary`}>
                Create the Super Admin
              </h1>
              <p className="mt-1.5 flex justify-center text-accent" aria-hidden="true">
                <GoldCross className="h-3 w-3" />
              </p>
              <p className="mx-auto mt-2 max-w-[22rem] text-center text-xs leading-relaxed text-muted-foreground">
                This is the first account on {PLATFORM_NAME}. After it is created, this page
                closes. Sign in with the same username and password.
              </p>
              <div className="mt-4">
                <SetupForm />
              </div>
            </div>
          </section>

          <aside className={`${styles.hero} order-4 lg:order-3`}>
            <Image
              src="/brand/setup-church-hero.png"
              alt=""
              fill
              priority
              sizes="(min-width: 1100px) 32vw, 100vw"
              className="object-cover object-[center_26%]"
            />
          </aside>
        </div>
      </div>
    </div>
  );
}

function Feature({
  icon,
  title,
  text,
}: {
  icon: ReactNode;
  title: string;
  text: string;
}) {
  return (
    <li className="flex items-start gap-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-accent/50 text-accent">
        {icon}
      </span>
      <div className="min-w-0 pt-0.5">
        <p className={`${styles.serif} text-sm font-semibold text-primary`}>{title}</p>
        <p className="text-[0.78rem] leading-snug text-muted-foreground">{text}</p>
      </div>
    </li>
  );
}
