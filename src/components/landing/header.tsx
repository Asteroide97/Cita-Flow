import Link from "next/link";

import { navigationLinks } from "@/data/landing";

import { ButtonLink } from "../ui/button-link";

export function Header() {
  return (
    <header className="sticky top-0 z-50 px-4 pt-4 sm:px-6">
      <div className="mx-auto flex max-w-6xl items-center justify-between rounded-full border border-white/80 bg-white/88 px-4 py-3 shadow-card backdrop-blur md:px-6">
        <Link
          href="#top"
          className="text-lg font-extrabold tracking-[-0.05em] text-ink sm:text-xl"
        >
          Cita<span className="text-brand-600">Flow</span>
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

        <div className="hidden items-center gap-3 md:flex">
          <ButtonLink href="#top" variant="ghost" className="px-4">
            Iniciar sesión
          </ButtonLink>
          <ButtonLink href="#cta">Agenda demo</ButtonLink>
        </div>

        <details className="relative md:hidden">
          <summary className="flex list-none cursor-pointer items-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-ink marker:hidden">
            Menú
            <span className="text-brand-600">+</span>
          </summary>

          <div className="absolute right-0 mt-3 w-72 rounded-[28px] border border-line bg-white p-4 shadow-card">
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
              <ButtonLink href="#top" variant="secondary">
                Iniciar sesión
              </ButtonLink>
              <ButtonLink href="#cta">Agenda demo</ButtonLink>
            </div>
          </div>
        </details>
      </div>
    </header>
  );
}
