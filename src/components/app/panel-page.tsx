import type { ReactNode } from "react";

type PanelPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
};

export function PanelPage({
  eyebrow,
  title,
  description,
  children,
}: PanelPageProps) {
  return (
    <section className="min-w-0">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-600">
        {eyebrow}
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-[-0.06em] text-ink sm:mt-4 sm:text-4xl lg:text-5xl">
        {title}
      </h1>
      <p className="mt-3 max-w-xl text-sm leading-6 text-muted sm:mt-4 sm:max-w-2xl sm:text-base sm:leading-7">
        {description}
      </p>

      {children ? <div className="mt-8">{children}</div> : null}
    </section>
  );
}
