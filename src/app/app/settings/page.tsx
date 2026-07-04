import Link from "next/link";

import { PanelPage } from "@/components/app/panel-page";
import {
  businessTypeOptions,
  getBusinessTypeLabel,
} from "@/data/business-types";
import { requireAuthContext } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

import { updateBusinessSettingsAction } from "./actions";

type SettingsPageProps = {
  searchParams: Promise<{
    status?: string;
    error?: string;
  }>;
};

function formFieldClassName() {
  return "mt-2 w-full rounded-2xl border border-line/80 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-100";
}

function resolveFlashMessage(status?: string, error?: string) {
  if (error) {
    switch (error) {
      case "business-not-found":
        return {
          tone: "error" as const,
          message: "No encontre el negocio actual para guardar la configuracion.",
        };
      case "business-name-required":
        return {
          tone: "error" as const,
          message: "El nombre del negocio es obligatorio.",
        };
      case "business-slug-required":
        return {
          tone: "error" as const,
          message: "El slug publico del negocio es obligatorio.",
        };
      case "business-slug-invalid":
        return {
          tone: "error" as const,
          message: "Usa solo minusculas, numeros y guiones para el slug.",
        };
      case "business-slug-unavailable":
        return {
          tone: "error" as const,
          message: "Ese slug ya esta en uso por otro negocio.",
        };
      case "business-type-invalid":
        return {
          tone: "error" as const,
          message: "Selecciona un tipo de negocio valido.",
        };
      case "business-timezone-required":
        return {
          tone: "error" as const,
          message: "La zona horaria es obligatoria.",
        };
      case "business-currency-required":
        return {
          tone: "error" as const,
          message: "La moneda es obligatoria.",
        };
      case "business-brand-color-invalid":
        return {
          tone: "error" as const,
          message: "El color de marca debe usar formato hexadecimal, por ejemplo #2563eb.",
        };
      case "business-website-invalid":
        return {
          tone: "error" as const,
          message: "El sitio web debe incluir http:// o https://.",
        };
      case "business-email-invalid":
        return {
          tone: "error" as const,
          message: "El email de contacto no tiene un formato valido.",
        };
      default:
        return {
          tone: "error" as const,
          message: "No pude guardar la configuracion del negocio.",
        };
    }
  }

  switch (status) {
    case "business-settings-updated":
      return {
        tone: "success" as const,
        message: "Configuracion del negocio actualizada correctamente.",
      };
    case "business-settings-unchanged":
      return {
        tone: "success" as const,
        message: "No habia cambios pendientes por guardar.",
      };
    default:
      return null;
  }
}

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const [authContext, query] = await Promise.all([
    requireAuthContext(),
    searchParams,
  ]);
  const clinic = await prisma.clinic.findUnique({
    where: {
      id: authContext.clinic.id,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      businessType: true,
      timezone: true,
      currency: true,
      brandColor: true,
      publicName: true,
      publicDescription: true,
      websiteUrl: true,
      contactEmail: true,
      contactPhone: true,
    },
  });

  if (!clinic) {
    throw new Error("No se pudo cargar el negocio actual.");
  }

  const flash = resolveFlashMessage(query.status, query.error);
  const bookingUrl = `/booking/${clinic.slug}`;
  const displayName = clinic.publicName ?? clinic.name;

  return (
    <PanelPage
      eyebrow="Configuracion"
      title="Configuracion del negocio"
      description="Ajusta la identidad publica de tu negocio, el slug de booking y los datos base que usara Agenda Viva en el panel y en la experiencia publica."
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(320px,0.92fr)_minmax(0,1.38fr)]">
        <div className="grid gap-6">
          <article className="surface-card p-6 sm:p-7">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">
              Vista actual
            </p>

            <div className="mt-5 grid gap-3">
              <div className="rounded-[22px] border border-line/80 bg-surface-soft px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                  Nombre publico
                </p>
                <p className="mt-2 text-lg font-semibold text-ink">{displayName}</p>
                <p className="mt-1 text-sm text-muted">
                  {clinic.publicDescription ??
                    "Sin descripcion publica corta por ahora."}
                </p>
              </div>

              <div className="rounded-[22px] border border-line/80 bg-white px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                  Link de booking
                </p>
                <p className="mt-2 break-all text-sm font-semibold text-ink">
                  {bookingUrl}
                </p>
                <div className="mt-3 flex flex-wrap gap-3">
                  <Link
                    href={bookingUrl}
                    className="rounded-full border border-line/80 bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:border-brand-200 hover:text-brand-700"
                  >
                    Abrir booking
                  </Link>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[22px] border border-line/80 bg-white px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                    Tipo de negocio
                  </p>
                  <p className="mt-2 text-sm font-semibold text-ink">
                    {getBusinessTypeLabel(clinic.businessType)}
                  </p>
                </div>

                <div className="rounded-[22px] border border-line/80 bg-white px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                    Color de marca
                  </p>
                  <div className="mt-2 flex items-center gap-3">
                    <span
                      className="h-5 w-5 rounded-full border border-line/80"
                      style={{ backgroundColor: clinic.brandColor ?? "#2563eb" }}
                    />
                    <p className="text-sm font-semibold text-ink">
                      {clinic.brandColor ?? "#2563eb"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </article>

          <article className="surface-card p-6 sm:p-7">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">
              Recomendaciones
            </p>

            <div className="mt-5 grid gap-3 text-sm text-muted">
              <div className="rounded-[22px] border border-line/80 bg-white px-4 py-4">
                Usa un slug corto y estable para no romper enlaces que ya hayas
                compartido.
              </div>
              <div className="rounded-[22px] border border-line/80 bg-white px-4 py-4">
                El nombre publico y la descripcion corta se reflejan en el booking sin
                cambiar la arquitectura interna del panel.
              </div>
              <div className="rounded-[22px] border border-line/80 bg-white px-4 py-4">
                El color de marca se aplica al booking publico para que la experiencia
                sea mas consistente con tu negocio.
              </div>
            </div>
          </article>
        </div>

        <div className="grid gap-6">
          {flash ? (
            <div
              className={
                flash.tone === "success"
                  ? "rounded-[26px] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-800"
                  : "rounded-[26px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-700"
              }
            >
              {flash.message}
            </div>
          ) : null}

          <article className="surface-card p-6 sm:p-7">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">
                Datos base del negocio
              </p>
              <p className="mt-2 text-sm leading-7 text-muted">
                Estos datos alimentan el panel actual y dejan lista la cuenta para una
                operacion multiindustria sin depender todavia de WhatsApp real.
              </p>
            </div>

            <form action={updateBusinessSettingsAction} className="mt-6 grid gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm font-semibold text-ink">
                  Nombre del negocio
                  <input
                    name="name"
                    required
                    defaultValue={clinic.name}
                    className={formFieldClassName()}
                    placeholder="Negocio Demo"
                  />
                </label>

                <label className="text-sm font-semibold text-ink">
                  Slug publico
                  <input
                    name="slug"
                    required
                    defaultValue={clinic.slug}
                    className={formFieldClassName()}
                    placeholder="clinica-demo"
                  />
                  <span className="mt-2 block text-xs text-muted">
                    Solo minusculas, numeros y guiones.
                  </span>
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <label className="text-sm font-semibold text-ink">
                  Tipo de negocio
                  <select
                    name="businessType"
                    defaultValue={clinic.businessType ?? ""}
                    className={formFieldClassName()}
                  >
                    <option value="">Sin definir</option>
                    {businessTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-sm font-semibold text-ink">
                  Zona horaria
                  <input
                    name="timezone"
                    required
                    defaultValue={clinic.timezone}
                    className={formFieldClassName()}
                    placeholder="America/Mexico_City"
                  />
                </label>

                <label className="text-sm font-semibold text-ink">
                  Moneda
                  <input
                    name="currency"
                    required
                    defaultValue={clinic.currency}
                    className={formFieldClassName()}
                    placeholder="MXN"
                  />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm font-semibold text-ink">
                  Color de marca
                  <input
                    name="brandColor"
                    defaultValue={clinic.brandColor ?? ""}
                    className={formFieldClassName()}
                    placeholder="#2563eb"
                  />
                </label>

                <label className="text-sm font-semibold text-ink">
                  Nombre publico para booking
                  <input
                    name="publicName"
                    defaultValue={clinic.publicName ?? ""}
                    className={formFieldClassName()}
                    placeholder="Negocio Demo"
                  />
                </label>
              </div>

              <label className="text-sm font-semibold text-ink">
                Descripcion publica corta
                <textarea
                  name="publicDescription"
                  rows={3}
                  defaultValue={clinic.publicDescription ?? ""}
                  className={formFieldClassName()}
                  placeholder="Reservas online para servicios, clases o atencion personalizada."
                />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm font-semibold text-ink">
                  Sitio web opcional
                  <input
                    name="websiteUrl"
                    defaultValue={clinic.websiteUrl ?? ""}
                    className={formFieldClassName()}
                    placeholder="https://tusitio.com"
                  />
                </label>

                <label className="text-sm font-semibold text-ink">
                  Email de contacto opcional
                  <input
                    type="email"
                    name="contactEmail"
                    defaultValue={clinic.contactEmail ?? ""}
                    className={formFieldClassName()}
                    placeholder="hola@negocio.com"
                  />
                </label>
              </div>

              <label className="text-sm font-semibold text-ink">
                Telefono de contacto opcional
                <input
                  name="contactPhone"
                  defaultValue={clinic.contactPhone ?? ""}
                  className={formFieldClassName()}
                  placeholder="+52 5512345678"
                />
              </label>

              <button
                type="submit"
                className="rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-700"
              >
                Guardar configuracion
              </button>
            </form>
          </article>
        </div>
      </div>
    </PanelPage>
  );
}
