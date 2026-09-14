import type { ReactNode } from "react";

import { Logo } from "@/components/logo";

interface AuthLayoutProps {
  title: string;
  description: string;
  children: ReactNode;
}

export function AuthLayout({ title, description, children }: AuthLayoutProps) {
  return (
    <main className="grid min-h-full bg-background lg:grid-cols-[minmax(0,1.15fr)_minmax(26rem,0.85fr)]">
      <section className="relative hidden overflow-hidden border-r bg-primary text-primary-foreground lg:flex lg:flex-col">
        <div
          className="pointer-events-none absolute inset-0 opacity-15"
          style={{
            backgroundImage:
              "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        <div className="relative flex h-16 items-center gap-3 border-b border-primary-foreground/20 px-8 xl:px-12">
          <Logo className="h-5 w-8 text-primary-foreground" />
          <span className="font-serif text-xl leading-none">Maille</span>
        </div>

        <div className="relative flex flex-1 items-center px-8 py-16 xl:px-16">
          <div className="max-w-xl">
            <p className="font-mono text-xs tracking-[0.08em] text-primary-foreground/70 uppercase">
              A precise personal ledger
            </p>
            <p className="mt-5 max-w-[11ch] font-serif text-5xl leading-[0.95] font-normal tracking-[-0.025em] text-balance xl:text-7xl">
              Every euro, fully accounted for.
            </p>
            <p className="mt-8 max-w-md text-base leading-7 text-primary-foreground/75">
              Double-entry bookkeeping for people who want to understand where
              their money is, why it moved, and what it is for.
            </p>
          </div>
        </div>

        <div className="relative grid grid-cols-3 border-t border-primary-foreground/20 font-mono text-xs tracking-[0.06em] uppercase">
          <div className="border-r border-primary-foreground/20 px-5 py-4">
            Double-entry
          </div>
          <div className="border-r border-primary-foreground/20 px-5 py-4">
            Self-hosted
          </div>
          <div className="px-5 py-4">Zero approximation</div>
        </div>
      </section>

      <section className="flex min-h-full flex-col">
        <div className="flex h-14 items-center gap-3 border-b px-5 lg:hidden">
          <Logo className="h-5 w-8 text-primary" />
          <span className="font-serif text-xl leading-none">Maille</span>
        </div>

        <div className="flex flex-1 items-center justify-center px-5 py-12 sm:px-10 lg:px-12">
          <div className="w-full max-w-md">
            <header className="mb-8 border-b pb-6">
              <h1 className="font-serif text-4xl leading-none font-normal tracking-[-0.025em] text-foreground">
                {title}
              </h1>
              <p className="mt-3 max-w-sm text-sm leading-6 text-muted-foreground">
                {description}
              </p>
            </header>
            {children}
          </div>
        </div>
      </section>
    </main>
  );
}
