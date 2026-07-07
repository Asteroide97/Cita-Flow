import Link from "next/link";
import type { ReactNode } from "react";

import { isSuperAdminEmail } from "@/lib/auth/superadmin";
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
  const showSuperAdminLink = isSuperAdminEmail(auth.user.email);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_#f4f8fc_0%,_#f8fbff_45%,_#ffffff_100%)] text-ink">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <AppSidebar
          clinicName={auth.clinic.name}
          clinicSlug={auth.clinic.slug}
          userName={auth.user.name}
          userEmail={auth.user.email}
          roleLabel={roleLabel}
          showSuperAdminLink={showSuperAdminLink}
        />

        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <header className="border-b border-line/70 bg-white/85 backdrop-blur">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-4 sm:px-8 lg:px-10 xl:flex-row xl:items-center xl:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">
                  Panel protegido
                </p>
                <p className="mt-1 truncate text-sm text-muted">
                  {auth.clinic.name} - /{auth.clinic.slug}
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap xl:items-center xl:justify-end">
                <div className="hidden rounded-[24px] border border-line/80 bg-white/92 px-4 py-3 shadow-soft lg:block">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
                    Usuario
                  </p>
                  <p className="mt-1 text-sm font-semibold text-ink">{auth.user.name}</p>
                  <p className="text-xs text-muted">{auth.user.email}</p>
                </div>

                <div className="hidden rounded-[24px] border border-line/80 bg-white/92 px-4 py-3 shadow-soft lg:block">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
                    Rol
                  </p>
                  <p className="mt-1 text-sm font-semibold text-ink">{roleLabel}</p>
                  <p className="text-xs text-muted">Negocio actual: {auth.clinic.name}</p>
                </div>

                <Link
                  href="/"
                  className="inline-flex w-full items-center justify-center rounded-full border border-line/80 bg-white px-4 py-3 text-sm font-semibold text-muted transition-colors hover:border-brand-200 hover:bg-white/70 hover:text-ink sm:w-auto xl:border-transparent xl:bg-transparent"
                >
                  Ver landing
                </Link>

                {showSuperAdminLink ? (
                  <Link
                    href="/superadmin"
                    className="inline-flex w-full items-center justify-center rounded-full border border-brand-200 bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-700 transition-colors hover:border-brand-300 hover:bg-brand-100 sm:w-auto"
                  >
                    Superadmin
                  </Link>
                ) : null}

                <form action="/logout" method="post" className="w-full sm:w-auto">
                  <Button type="submit" variant="secondary" className="w-full xl:w-auto">
                    Cerrar sesion
                  </Button>
                </form>
              </div>
            </div>
          </header>

          <main className="flex-1">
            <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-8 lg:px-10">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
