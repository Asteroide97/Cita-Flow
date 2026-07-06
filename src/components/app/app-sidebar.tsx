"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { panelNavigation, superAdminNavigationItem } from "@/data/panel";
import { brand } from "@/lib/brand";
import { cn } from "@/lib/utils";

type AppSidebarProps = {
  clinicName: string;
  clinicSlug: string;
  userName: string;
  userEmail: string;
  roleLabel: string;
  showSuperAdminLink?: boolean;
};

export function AppSidebar({
  clinicName,
  clinicSlug,
  userName,
  userEmail,
  roleLabel,
  showSuperAdminLink = false,
}: AppSidebarProps) {
  const pathname = usePathname();
  const navigationItems = showSuperAdminLink
    ? [...panelNavigation, superAdminNavigationItem]
    : panelNavigation;

  return (
    <>
      <aside className="hidden w-80 shrink-0 border-r border-line/70 bg-slate-950 text-white lg:flex">
        <div className="flex min-h-screen w-full flex-col px-6 py-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,_#1d4ed8_0%,_#60a5fa_100%)]">
              <span className="grid h-5 w-5 grid-cols-2 gap-1">
                <span className="rounded-full bg-white" />
                <span className="rounded-full bg-white/65" />
                <span className="rounded-full bg-white/65" />
                <span className="rounded-full bg-white" />
              </span>
            </span>

            <div>
              <p className="text-lg font-extrabold tracking-[-0.05em]">{brand.name}</p>
              <p className="text-sm text-slate-400">Panel protegido</p>
            </div>
          </Link>

          <div className="mt-8 rounded-[28px] border border-white/10 bg-white/5 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Negocio actual
            </p>
            <p className="mt-3 text-base font-semibold text-white">{clinicName}</p>
            <p className="mt-1 text-sm text-slate-400">/{clinicSlug}</p>
          </div>

          <div className="mt-4 rounded-[28px] border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Acceso
                </p>
                <p className="mt-3 text-base font-semibold text-white">{userName}</p>
                <p className="mt-1 text-sm text-slate-400">{userEmail}</p>
              </div>

              <span className="rounded-full border border-brand-400/30 bg-brand-500/12 px-3 py-1 text-xs font-semibold text-blue-100">
                {roleLabel}
              </span>
            </div>
          </div>

          <nav className="mt-8 flex flex-1 flex-col gap-2">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-[24px] border px-4 py-4 transition-all duration-200",
                    isActive
                      ? "border-brand-500/40 bg-brand-600 text-white shadow-soft"
                      : "border-transparent bg-transparent text-slate-300 hover:border-white/10 hover:bg-white/6 hover:text-white",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-2xl text-xs font-bold",
                        isActive
                          ? "bg-white/12 text-white"
                          : "bg-white/8 text-slate-300",
                      )}
                    >
                      {item.shortLabel}
                    </span>

                    <div>
                      <p className="text-sm font-semibold">{item.label}</p>
                      <p
                        className={cn(
                          "mt-1 text-xs",
                          isActive ? "text-blue-100/80" : "text-slate-400",
                        )}
                      >
                        {item.description}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </nav>

          <div className="rounded-[28px] border border-emerald-500/20 bg-emerald-500/10 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
              Cuenta actual
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-200">
              Si tienes varias cuentas, usamos la primera activa.
            </p>
          </div>
        </div>
      </aside>

      <div className="border-b border-line/70 bg-white/95 px-4 py-4 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,_#1d4ed8_0%,_#60a5fa_100%)]">
              <span className="grid h-4 w-4 grid-cols-2 gap-1">
                <span className="rounded-full bg-white" />
                <span className="rounded-full bg-white/65" />
                <span className="rounded-full bg-white/65" />
                <span className="rounded-full bg-white" />
              </span>
            </span>
            <div>
              <p className="text-base font-extrabold tracking-[-0.04em] text-ink">
                {brand.name}
              </p>
              <p className="text-xs text-muted">
                {clinicName} - {roleLabel}
              </p>
            </div>
          </Link>
        </div>

        <div className="mt-4 rounded-[22px] border border-line/80 bg-white px-4 py-3">
          <p className="text-sm font-semibold text-ink">{userName}</p>
          <p className="mt-1 text-xs text-muted">{userEmail}</p>
        </div>

        <nav className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
                  isActive
                    ? "border-brand-200 bg-brand-600 text-white"
                    : "border-line/80 bg-white text-muted",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
