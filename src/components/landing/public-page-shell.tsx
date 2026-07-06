import type { ReactNode } from "react";

import { PublicFooter } from "./footer";
import { PublicHeader } from "./header";

type PublicPageShellProps = {
  children: ReactNode;
};

export function PublicPageShell({ children }: PublicPageShellProps) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,_#f8fbff_0%,_#f3f7fb_42%,_#ffffff_100%)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[32rem] bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.14),_transparent_58%)]" />
      <div className="pointer-events-none absolute left-1/2 top-20 h-64 w-64 -translate-x-1/2 rounded-full bg-brand-100/55 blur-3xl" />

      <div className="relative">
        <PublicHeader />
        {children}
        <PublicFooter />
      </div>
    </main>
  );
}
