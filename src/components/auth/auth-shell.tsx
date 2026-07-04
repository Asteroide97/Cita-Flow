import Link from "next/link";
import type { ReactNode } from "react";

type AuthHighlight = {
  label: string;
  value: string;
  note: string;
};

type AuthShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  asideTitle: string;
  asideDescription: string;
  highlights: AuthHighlight[];
  checklist: string[];
  children: ReactNode;
};

export function AuthShell({
  eyebrow,
  title,
  description,
  asideTitle,
  asideDescription,
  highlights,
  checklist,
  children,
}: AuthShellProps) {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_#f6f9fd_0%,_#edf5ff_42%,_#ffffff_100%)] text-ink">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6 sm:px-8 lg:px-10">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,_#1d4ed8_0%,_#60a5fa_100%)] shadow-soft">
            <span className="grid h-4 w-4 grid-cols-2 gap-1">
              <span className="rounded-full bg-white" />
              <span className="rounded-full bg-white/70" />
              <span className="rounded-full bg-white/70" />
              <span className="rounded-full bg-white" />
            </span>
          </span>

          <div>
            <p className="text-lg font-extrabold tracking-[-0.05em] text-ink">Agenda Viva</p>
            <p className="text-sm text-muted">Acceso al panel SaaS</p>
          </div>
        </Link>

        <Link
          href="/"
          className="rounded-full border border-line/80 bg-white/90 px-4 py-2 text-sm font-semibold text-ink shadow-soft transition-colors hover:border-brand-200 hover:bg-brand-50"
        >
          Ver landing
        </Link>
      </div>

      <div className="mx-auto grid max-w-6xl gap-8 px-5 pb-10 sm:px-8 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:px-10 lg:pb-16">
        <section className="surface-card p-6 sm:p-8 lg:p-10">
          <div className="eyebrow-chip">{eyebrow}</div>
          <h1 className="mt-6 max-w-xl text-4xl font-semibold tracking-[-0.06em] text-ink sm:text-5xl">
            {title}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-muted sm:text-lg">
            {description}
          </p>

          <div className="mt-8">{children}</div>
        </section>

        <aside className="hidden rounded-[36px] bg-slate-950 p-8 text-white shadow-float lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="inline-flex rounded-full border border-white/12 bg-white/8 px-4 py-2 text-sm font-semibold text-blue-100">
              Base protegida
            </div>
            <h2 className="mt-6 text-4xl font-semibold tracking-[-0.05em] text-white">
              {asideTitle}
            </h2>
            <p className="mt-5 max-w-xl text-base leading-8 text-slate-300">
              {asideDescription}
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {highlights.map((highlight) => (
                <article
                  key={highlight.label}
                  className="rounded-[28px] border border-white/10 bg-white/6 p-5"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    {highlight.label}
                  </p>
                  <p className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-white">
                    {highlight.value}
                  </p>
                  <p className="mt-3 text-sm leading-7 text-slate-300">{highlight.note}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="mt-8 rounded-[30px] border border-white/10 bg-white/6 p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-100">
              Lo que queda listo
            </p>
            <div className="mt-5 grid gap-3">
              {checklist.map((item, index) => (
                <div
                  key={item}
                  className="flex items-start gap-3 rounded-[22px] border border-white/8 bg-white/6 px-4 py-4"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-white">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <p className="text-sm leading-7 text-slate-200">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
