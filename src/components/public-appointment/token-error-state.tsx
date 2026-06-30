import Link from "next/link";

type TokenErrorStateProps = {
  title: string;
  description: string;
  ctaHref?: string;
  ctaLabel?: string;
};

export function TokenErrorState({
  title,
  description,
  ctaHref = "/",
  ctaLabel = "Volver al inicio",
}: TokenErrorStateProps) {
  return (
    <section className="surface-card p-6 sm:p-8">
      <span className="inline-flex rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700">
        Enlace no disponible
      </span>

      <h2 className="mt-5 text-3xl font-semibold tracking-[-0.06em] text-ink sm:text-4xl">
        {title}
      </h2>
      <p className="mt-4 text-base leading-8 text-muted">{description}</p>

      <div className="mt-8">
        <Link
          href={ctaHref}
          className="inline-flex rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
        >
          {ctaLabel}
        </Link>
      </div>
    </section>
  );
}
