import Link from "next/link";

import { footerLinks } from "@/data/landing";

export function Footer() {
  return (
    <footer id="footer" className="pb-10 pt-8">
      <div className="container-shell">
        <div className="rounded-[32px] border border-line bg-white px-6 py-8 shadow-card sm:px-8">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-md">
              <p className="text-xl font-extrabold tracking-[-0.05em] text-ink">
                Cita<span className="text-brand-600">Flow</span>
              </p>
              <p className="mt-4 text-sm leading-7 text-muted">
                Plataforma SaaS de reservas médicas para consultorios y clínicas que
                buscan operar con más orden, confirmaciones y menos no-shows.
              </p>
            </div>

            <nav className="flex flex-wrap gap-4 sm:gap-6">
              {footerLinks.map((item) => {
                const isMailLink = item.href.startsWith("mailto:");

                if (isMailLink) {
                  return (
                    <a
                      key={item.label}
                      href={item.href}
                      className="text-sm font-medium text-muted transition-colors hover:text-ink"
                    >
                      {item.label}
                    </a>
                  );
                }

                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="text-sm font-medium text-muted transition-colors hover:text-ink"
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="mt-8 border-t border-line pt-5 text-sm text-muted">
            © 2026 CitaFlow. Todos los derechos reservados.
          </div>
        </div>
      </div>
    </footer>
  );
}
