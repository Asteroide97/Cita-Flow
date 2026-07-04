import Link from "next/link";
import type { ReactNode } from "react";

import { brand } from "@/lib/brand";

function hexToRgba(hexColor: string, alpha: number) {
  const normalized = hexColor.replace("#", "");
  const compact =
    normalized.length === 3
      ? normalized
          .split("")
          .map((value) => `${value}${value}`)
          .join("")
      : normalized;
  const red = Number.parseInt(compact.slice(0, 2), 16);
  const green = Number.parseInt(compact.slice(2, 4), 16);
  const blue = Number.parseInt(compact.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

type BookingShellProps = {
  clinicName: string;
  clinicSlug: string;
  clinicDescription?: string | null;
  clinicWebsiteUrl?: string | null;
  clinicContactEmail?: string | null;
  clinicContactPhone?: string | null;
  title: string;
  description: string;
  brandColor: string;
  aside?: ReactNode;
  children: ReactNode;
};

export function BookingShell({
  clinicName,
  clinicSlug,
  clinicDescription,
  clinicWebsiteUrl,
  clinicContactEmail,
  clinicContactPhone,
  title,
  description,
  brandColor,
  aside,
  children,
}: BookingShellProps) {
  const hasContactDetails =
    Boolean(clinicWebsiteUrl) || Boolean(clinicContactEmail) || Boolean(clinicContactPhone);

  return (
    <div
      className="min-h-screen text-ink"
      style={{
        ["--booking-brand" as string]: brandColor,
        backgroundImage: `radial-gradient(circle at top left, ${hexToRgba(brandColor, 0.16)}, transparent 24%), radial-gradient(circle at top right, rgba(125, 211, 252, 0.16), transparent 22%), linear-gradient(180deg, #f8fbff 0%, #f3f8fd 34%, #ffffff 100%)`,
      }}
    >
      <div className="container-shell py-6 sm:py-8">
        <div className="flex flex-col gap-4 rounded-[30px] border border-white/80 bg-white/72 px-5 py-5 shadow-soft backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <span
              className="flex h-11 w-11 items-center justify-center rounded-2xl shadow-soft"
              style={{
                background: `linear-gradient(135deg, ${brandColor} 0%, #93c5fd 100%)`,
              }}
            >
              <span className="grid h-4 w-4 grid-cols-2 gap-1">
                <span className="rounded-full bg-white" />
                <span className="rounded-full bg-white/65" />
                <span className="rounded-full bg-white/65" />
                <span className="rounded-full bg-white" />
              </span>
            </span>

            <div>
              <p className="text-lg font-extrabold tracking-[-0.05em] text-ink">
                {brand.name}
              </p>
              <p className="text-sm text-muted">Reserva pública del negocio</p>
            </div>
          </Link>

          <div className="rounded-[22px] border border-line/80 bg-white/90 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
              Negocio
            </p>
            <p className="mt-1 text-sm font-semibold text-ink">{clinicName}</p>
            <p className="text-xs text-muted">/{clinicSlug}</p>
            {clinicDescription ? (
              <p className="mt-2 max-w-xs text-xs leading-6 text-muted">
                {clinicDescription}
              </p>
            ) : null}
            {hasContactDetails ? (
              <div className="mt-3 grid gap-2 border-t border-line/70 pt-3 text-xs text-muted">
                {clinicWebsiteUrl ? (
                  <a
                    href={clinicWebsiteUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="break-all font-medium text-ink transition hover:text-brand-700"
                  >
                    Sitio web: {clinicWebsiteUrl}
                  </a>
                ) : null}
                {clinicContactEmail ? (
                  <a
                    href={`mailto:${clinicContactEmail}`}
                    className="break-all font-medium text-ink transition hover:text-brand-700"
                  >
                    Email: {clinicContactEmail}
                  </a>
                ) : null}
                {clinicContactPhone ? (
                  <a
                    href={`tel:${clinicContactPhone}`}
                    className="font-medium text-ink transition hover:text-brand-700"
                  >
                    Telefono: {clinicContactPhone}
                  </a>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        <div
          className={
            aside
              ? "mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_360px]"
              : "mt-8 grid gap-6"
          }
        >
          <div className="grid gap-6">
            <section className="surface-card p-6 sm:p-8">
              <span
                className="inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold shadow-soft"
                style={{
                  backgroundColor: hexToRgba(brandColor, 0.1),
                  color: brandColor,
                }}
              >
                Reserva sin llamadas ni mensajes manuales
              </span>

              <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-[-0.07em] text-ink sm:text-5xl">
                {title}
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-8 text-muted sm:text-lg">
                {description}
              </p>
            </section>

            {children}
          </div>

          {aside ? (
            <div className="grid gap-6 self-start xl:sticky xl:top-6">{aside}</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
