import Link from "next/link";
import type { ReactNode } from "react";

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

type PublicAppointmentShellProps = {
  clinicName: string;
  clinicSlug: string;
  brandColor: string;
  title: string;
  description: string;
  children: ReactNode;
};

export function PublicAppointmentShell({
  clinicName,
  clinicSlug,
  brandColor,
  title,
  description,
  children,
}: PublicAppointmentShellProps) {
  return (
    <div
      className="min-h-screen text-ink"
      style={{
        ["--public-appointment-brand" as string]: brandColor,
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
                CitaFlow
              </p>
              <p className="text-sm text-muted">Autoservicio de reservas</p>
            </div>
          </Link>

          <div className="rounded-[22px] border border-line/80 bg-white/90 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
              Negocio
            </p>
            <p className="mt-1 text-sm font-semibold text-ink">{clinicName}</p>
            <p className="text-xs text-muted">/{clinicSlug}</p>
          </div>
        </div>

        <main className="mx-auto mt-8 max-w-4xl">
          <section className="surface-card p-6 sm:p-8">
            <span
              className="inline-flex rounded-full px-4 py-2 text-sm font-semibold shadow-soft"
              style={{
                backgroundColor: hexToRgba(brandColor, 0.1),
                color: brandColor,
              }}
            >
              Gestiona tu reserva sin iniciar sesión
            </span>

            <h1 className="mt-5 text-4xl font-semibold tracking-[-0.07em] text-ink sm:text-5xl">
              {title}
            </h1>
            <p className="mt-5 text-base leading-8 text-muted sm:text-lg">
              {description}
            </p>
          </section>

          <div className="mt-6 grid gap-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
