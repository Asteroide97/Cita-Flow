import Link from "next/link";

import { navigationLinks } from "@/data/landing";
import { brand } from "@/lib/brand";

import { ButtonLink } from "../ui/button-link";

export function Header() {
  const [brandLead, ...brandRest] = brand.name.split(" ");

  return (
    <header className="sticky top-0 z-50 px-4 pt-4 sm:px-6">
      <div className="mx-auto flex max-w-6xl items-center justify-between rounded-full border border-white/80 bg-white/82 px-3 py-3 shadow-soft backdrop-blur-xl sm:px-4 md:px-6">
        <Link href="#top" className="flex min-w-0 items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,_#1d4ed8_0%,_#60a5fa_100%)] shadow-soft">
            <span className="grid h-5 w-5 grid-cols-2 gap-1">
              <span className="rounded-full bg-white" />
              <span className="rounded-full bg-white/65" />
              <span className="rounded-full bg-white/65" />
              <span className="rounded-full bg-white" />
            </span>
          </span>

          <span className="block text-lg font-extrabold tracking-[-0.05em] text-ink sm:text-xl">
            {brandLead} <span className="text-brand-600">{brandRest.join(" ")}</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navigationLinks.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="text-sm font-medium text-muted transition-colors hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <ButtonLink href="/login" variant="ghost" className="px-4">
            Iniciar sesión
          </ButtonLink>
          <ButtonLink href="#cta" className="px-5">
            Probar gratis
          </ButtonLink>
        </div>

        <details className="relative md:hidden">
          <summary className="flex h-11 w-11 list-none cursor-pointer items-center justify-center gap-2 rounded-full border border-line/80 bg-white/92 text-sm font-semibold text-ink shadow-soft marker:hidden">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-50 text-brand-700">
              ≡
            </span>
          </summary>

          <div className="absolute right-0 mt-3 w-[min(18rem,calc(100vw-2rem))] rounded-[28px] border border-white/80 bg-white/96 p-4 shadow-float backdrop-blur-xl">
            <nav className="flex flex-col gap-2">
              {navigationLinks.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="rounded-2xl px-3 py-3 text-sm font-medium text-muted transition-colors hover:bg-brand-50 hover:text-ink"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="mt-4 grid gap-3">
              <ButtonLink href="/login" variant="secondary">
                Iniciar sesión
              </ButtonLink>
              <ButtonLink href="#cta">Probar gratis</ButtonLink>
            </div>
          </div>
        </details>
      </div>
    </header>
  );
}
