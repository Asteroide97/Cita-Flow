import Link from "next/link";
import type { ReactNode } from "react";

type CalendarSidePanelProps = {
  eyebrow: string;
  title: string;
  description?: string;
  closeHref?: string | null;
  children: ReactNode;
};

export function CalendarSidePanel({
  eyebrow,
  title,
  description,
  closeHref,
  children,
}: CalendarSidePanelProps) {
  return (
    <aside className="min-w-0 rounded-[28px] border border-line/80 bg-white/96 p-4 shadow-soft sm:p-5 xl:sticky xl:top-4 xl:max-h-[calc(100vh-2rem)] xl:overflow-y-auto">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
            {eyebrow}
          </p>
          <h2 className="mt-1.5 text-lg font-semibold tracking-[-0.04em] text-ink sm:text-xl">
            {title}
          </h2>
          {description ? (
            <p className="mt-1.5 text-sm leading-6 text-muted">{description}</p>
          ) : null}
        </div>

        {closeHref ? (
          <Link
            href={closeHref}
            className="inline-flex rounded-full border border-line/80 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted transition-colors hover:border-brand-200 hover:bg-brand-50 hover:text-ink"
          >
            Cerrar
          </Link>
        ) : null}
      </div>

      <div className="mt-4">{children}</div>
    </aside>
  );
}
