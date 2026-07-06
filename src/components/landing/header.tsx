"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { publicNavigationLinks } from "@/data/landing";
import { brand } from "@/lib/brand";
import { cn } from "@/lib/utils";

import { ButtonLink } from "../ui/button-link";

function isActivePath(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname.startsWith(href);
}

export function PublicHeader() {
  const pathname = usePathname();
  const [brandLead, ...brandRest] = brand.name.split(" ");

  return (
    <header className="sticky top-0 z-50 px-4 pt-4 sm:px-6">
      <div className="mx-auto max-w-6xl rounded-[30px] border border-white/80 bg-white/86 shadow-soft backdrop-blur-xl">
        <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-5 md:px-6">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,_#1d4ed8_0%,_#60a5fa_100%)] shadow-soft">
              <span className="grid h-5 w-5 grid-cols-2 gap-1">
                <span className="rounded-full bg-white" />
                <span className="rounded-full bg-white/70" />
                <span className="rounded-full bg-white/70" />
                <span className="rounded-full bg-white" />
              </span>
            </span>

            <span className="truncate text-lg font-extrabold tracking-[-0.05em] text-ink sm:text-xl">
              {brandLead} <span className="text-brand-600">{brandRest.join(" ")}</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-2 md:flex">
            {publicNavigationLinks.map((item) => {
              const active = isActivePath(pathname, item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                    active
                      ? "bg-brand-50 text-brand-700"
                      : "text-muted hover:bg-slate-50 hover:text-ink",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <ButtonLink href="/login" variant="ghost" className="hidden px-4 sm:inline-flex">
              Iniciar sesión
            </ButtonLink>
            <ButtonLink href="/registro" className="px-4 sm:px-5">
              Probar gratis
            </ButtonLink>
          </div>
        </div>

        <div className="border-t border-line/70 px-3 pb-3 pt-3 md:hidden">
          <nav className="flex gap-2 overflow-x-auto pb-1">
            {publicNavigationLinks.map((item) => {
              const active = isActivePath(pathname, item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                    active
                      ? "bg-brand-600 text-white"
                      : "border border-line/80 bg-white text-muted hover:text-ink",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}

            <Link
              href="/login"
              className="shrink-0 rounded-full border border-line/80 bg-white px-4 py-2 text-sm font-semibold text-muted transition-colors hover:text-ink sm:hidden"
            >
              Iniciar sesión
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
