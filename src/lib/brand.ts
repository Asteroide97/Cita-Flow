const fallbackAppUrl = "https://cita-flow-tau.vercel.app";

export const brand = {
  name: "Agenda Viva",
  slug: "agenda-viva",
  legalName: "Agenda Viva",
  tagline:
    "Agenda Viva automatiza reservas, recordatorios y horarios liberados para negocios de servicios.",
  shortTagline: "Reservas simples para negocios de servicios.",
  supportEmail: "hola@agendaviva.app",
  websiteUrl: "https://agenda-viva.app",
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? fallbackAppUrl,
  metaTitle: "Agenda Viva | Reservas para negocios de servicios",
  metaDescription:
    "Agenda Viva automatiza reservas, recordatorios y horarios liberados para negocios de servicios.",
  demo: {
    legalName: "Agenda Viva Negocio Demo S.A. de C.V.",
    websiteUrl: "https://demo.agendaviva.app",
    contactEmail: "hola@agendaviva-demo.app",
  },
} as const;

export const brandSupportMailto = `mailto:${brand.supportEmail}`;

export function withBrandTitle(prefix: string) {
  return `${prefix} | ${brand.name}`;
}
