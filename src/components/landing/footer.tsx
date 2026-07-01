import Link from "next/link";

import { footerLinks } from "@/data/landing";

export function Footer() {
  return (
    <footer id="footer" className="pb-10 pt-10">
      <div className="container-shell">
        <div className="rounded-[34px] bg-slate-950 px-6 py-8 shadow-float sm:px-8 sm:py-10">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-md">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,_#1d4ed8_0%,_#60a5fa_100%)]">
                  <span className="grid h-5 w-5 grid-cols-2 gap-1">
                    <span className="rounded-full bg-white" />
                    <span className="rounded-full bg-white/65" />
                    <span className="rounded-full bg-white/65" />
                    <span className="rounded-full bg-white" />
                  </span>
                </span>
                <p className="text-xl font-extrabold tracking-[-0.05em] text-white">
                  CitaFlow
                </p>
              </div>

              <p className="mt-4 text-sm leading-7 text-slate-300">
                Plataforma SaaS de reservas para negocios de servicios que buscan
                operar con más orden, confirmaciones y menos ausencias.
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
                      className="text-sm font-medium text-slate-300 transition-colors hover:text-white"
                    >
                      {item.label}
                    </a>
                  );
                }

                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="text-sm font-medium text-slate-300 transition-colors hover:text-white"
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="mt-8 border-t border-white/10 pt-5 text-sm text-slate-400">
            © 2026 CitaFlow. Todos los derechos reservados.
          </div>
        </div>
      </div>
    </footer>
  );
}
