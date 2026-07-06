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
    <section>
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-600">
        {eyebrow}
      </p>
      <h1 className="mt-4 text-4xl font-semibold tracking-[-0.06em] text-ink sm:text-5xl">
        {title}
      </h1>
      <p className="mt-4 max-w-2xl text-sm leading-7 text-muted sm:text-base">
        {description}
      </p>

      {children ? <div className="mt-8">{children}</div> : null}
    </section>
  );
}
