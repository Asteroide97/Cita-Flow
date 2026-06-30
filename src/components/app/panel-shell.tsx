import Link from "next/link";
import type { ReactNode } from "react";

import type { TemporaryClinicContext } from "@/lib/demo-tenant";

import { ButtonLink } from "../ui/button-link";
import { AppSidebar } from "./app-sidebar";

type PanelShellProps = {
  clinic: TemporaryClinicContext;
  children: ReactNode;
};

export function PanelShell({ clinic, children }: PanelShellProps) {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_#f4f8fc_0%,_#f8fbff_45%,_#ffffff_100%)] text-ink">
      <div className="flex min-h-screen">
        <AppSidebar clinicName={clinic.clinicName} clinicSlug={clinic.clinicSlug} />

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="border-b border-line/70 bg-white/85 backdrop-blur">
            <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8 lg:px-10">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">
                  SaaS multi-tenant inicial
                </p>
                <p className="mt-1 text-sm text-muted">
                  Clinic temporal: {clinic.clinicName} · slug {clinic.clinicSlug}
                </p>
              </div>

              <div className="hidden items-center gap-3 sm:flex">
                <Link
                  href="/"
                  className="text-sm font-semibold text-muted transition-colors hover:text-ink"
                >
                  Ver landing
                </Link>
                <ButtonLink href="/app/dashboard" variant="secondary">
                  Panel demo
                </ButtonLink>
              </div>
            </div>
          </header>

          <main className="flex-1">
            <div className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 lg:px-10">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
