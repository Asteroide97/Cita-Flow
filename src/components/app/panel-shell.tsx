import Link from "next/link";
import type { ReactNode } from "react";

import type { AuthContext } from "@/lib/auth/session";
import { getRoleLabel } from "@/lib/auth/session";

import { Button } from "../ui/button";
import { AppSidebar } from "./app-sidebar";

type PanelShellProps = {
  auth: AuthContext;
  children: ReactNode;
};

export function PanelShell({ auth, children }: PanelShellProps) {
  const roleLabel = getRoleLabel(auth.membership.role);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_#f4f8fc_0%,_#f8fbff_45%,_#ffffff_100%)] text-ink">
      <div className="flex min-h-screen">
        <AppSidebar
          clinicName={auth.clinic.name}
          clinicSlug={auth.clinic.slug}
          userName={auth.user.name}
          userEmail={auth.user.email}
          roleLabel={roleLabel}
        />

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="border-b border-line/70 bg-white/85 backdrop-blur">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-5 py-4 sm:px-8 lg:px-10 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">
                  Panel protegido
                </p>
                <p className="mt-1 text-sm text-muted">
                  Sesion activa para {auth.clinic.name} · /{auth.clinic.slug}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:flex xl:flex-wrap xl:items-center xl:justify-end">
                <div className="rounded-[24px] border border-line/80 bg-white/92 px-4 py-3 shadow-soft">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
                    Usuario
                  </p>
                  <p className="mt-1 text-sm font-semibold text-ink">{auth.user.name}</p>
                  <p className="text-xs text-muted">{auth.user.email}</p>
                </div>

                <div className="rounded-[24px] border border-line/80 bg-white/92 px-4 py-3 shadow-soft">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
                    Rol
                  </p>
                  <p className="mt-1 text-sm font-semibold text-ink">{roleLabel}</p>
                  <p className="text-xs text-muted">Clinica actual: {auth.clinic.name}</p>
                </div>

                <Link
                  href="/"
                  className="inline-flex items-center justify-center rounded-full border border-transparent px-4 py-3 text-sm font-semibold text-muted transition-colors hover:bg-white/70 hover:text-ink"
                >
                  Ver landing
                </Link>

                <form action="/logout" method="post">
                  <Button type="submit" variant="secondary" className="w-full xl:w-auto">
                    Cerrar sesion
                  </Button>
                </form>
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
