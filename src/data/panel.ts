export type PanelNavItem = {
  label: string;
  href: string;
  shortLabel: string;
  description: string;
};

export type DashboardMetric = {
  label: string;
  value: string;
  note: string;
  tone: "brand" | "emerald" | "amber" | "slate";
};

export type PanelSectionContent = {
  title: string;
  description: string;
  highlights: string[];
};

export const panelNavigation: PanelNavItem[] = [
  {
    label: "Dashboard",
    href: "/app/dashboard",
    shortLabel: "DB",
    description: "Resumen operativo del negocio.",
  },
  {
    label: "Agenda",
    href: "/app/calendar",
    shortLabel: "AG",
    description: "Vista general de horarios y disponibilidad.",
  },
  {
    label: "Reservas",
    href: "/app/appointments",
    shortLabel: "RS",
    description: "Seguimiento de confirmaciones y estados.",
  },
  {
    label: "Clientes",
    href: "/app/patients",
    shortLabel: "CL",
    description: "Base inicial de clientes por negocio.",
  },
  {
    label: "Profesionales",
    href: "/app/doctors",
    shortLabel: "PR",
    description: "Equipo de atención y perfiles.",
  },
  {
    label: "Servicios",
    href: "/app/services",
    shortLabel: "SV",
    description: "Catálogo base de servicios y duraciones.",
  },
  {
    label: "Reportes",
    href: "/app/reports",
    shortLabel: "RP",
    description: "Desempeno de reservas, clientes y servicios.",
  },
  {
    label: "WhatsApp",
    href: "/app/whatsapp-simulator",
    shortLabel: "WA",
    description: "Simulador local del motor conversacional.",
  },
  {
    label: "Notificaciones",
    href: "/app/notifications",
    shortLabel: "NT",
    description: "Outbox transaccional para WhatsApp y email.",
  },
  {
    label: "Lista de espera",
    href: "/app/waitlist",
    shortLabel: "LE",
    description: "Solicitudes y ofertas por horarios liberados.",
  },
  {
    label: "Configuración",
    href: "/app/settings",
    shortLabel: "CF",
    description: "Cuenta, branding y parámetros del negocio.",
  },
];

export const dashboardMetrics: DashboardMetric[] = [
  {
    label: "Reservas de hoy",
    value: "12",
    note: "2 pendientes por confirmar",
    tone: "brand",
  },
  {
    label: "Ingresos del mes",
    value: "$24,500",
    note: "placeholder hasta conectar pagos reales",
    tone: "emerald",
  },
  {
    label: "No-shows",
    value: "3",
    note: "últimos 30 días",
    tone: "amber",
  },
  {
    label: "Clientes nuevos",
    value: "18",
    note: "captados este mes",
    tone: "slate",
  },
];

export const panelSections: Record<string, PanelSectionContent> = {
  calendar: {
    title: "Agenda",
    description:
      "Aquí vivirá la vista operativa de calendario con disponibilidad, profesionales y reacomodos.",
    highlights: [
      "Calendario diario, semanal y por profesional.",
      "Bloqueos de horario y disponibilidad por negocio.",
      "Reagendado y estados de reserva en tiempo real.",
    ],
  },
  appointments: {
    title: "Reservas",
    description:
      "Esta sección concentrará confirmaciones, cancelaciones, origen de reserva y seguimiento operativo.",
    highlights: [
      "Listado por estado y rango de fechas.",
      "Filtros por profesional, servicio y origen.",
      "Acciones futuras de confirmar, reagendar y cancelar.",
    ],
  },
  patients: {
    title: "Clientes",
    description:
      "Base inicial de clientes por negocio, con datos de contacto y notas internas.",
    highlights: [
      "Buscador de clientes por nombre, teléfono y email.",
      "Historial de reservas por cliente.",
      "Notas privadas para recepción y staff.",
    ],
  },
  doctors: {
    title: "Profesionales",
    description:
      "Catálogo del equipo de atención, con roles o especialidades y futura asignación de agenda.",
    highlights: [
      "Relación opcional entre profesional y user del sistema.",
      "Rol o especialidad, descripción y estado activo.",
      "Preparado para agenda multi-profesional.",
    ],
  },
  services: {
    title: "Servicios",
    description:
      "Catálogo base del negocio con duración, precios y reglas futuras de anticipos.",
    highlights: [
      "Duración estándar por servicio.",
      "Precio y anticipo opcional por reserva.",
      "Preparado para reservas y página pública.",
    ],
  },
  reports: {
    title: "Reportes",
    description:
      "Vista compacta para entender volumen, estados y desempeno del negocio usando reservas reales filtradas por rango, profesional y servicio.",
    highlights: [
      "Metricas clave de reservas, cancelaciones y no-show.",
      "Top de servicios, profesionales y clientes.",
      "Base lista para crecer hacia exportaciones y analitica mas avanzada.",
    ],
  },
  notifications: {
    title: "Notificaciones",
    description:
      "Outbox transaccional por negocio para preparar mensajes de WhatsApp y email antes de conectar proveedores reales.",
    highlights: [
      "Mensajes pendientes, enviados, fallidos o cancelados.",
      "Templates internos con contexto de reserva y enlaces públicos.",
      "Base lista para conectar Meta Cloud API y email más adelante.",
    ],
  },
  waitlist: {
    title: "Lista de espera",
    description:
      "Solicitudes públicas para ocupar espacios liberados con matching por servicio, profesional y preferencia horaria.",
    highlights: [
      "Entradas activas, ofertadas, convertidas o expiradas.",
      "Ofertas públicas con expiración y aceptación por token.",
      "Base lista para conectar recordatorios y canales reales después.",
    ],
  },
  settings: {
    title: "Configuración",
    description:
      "Zona base de la cuenta para branding, datos legales y parámetros generales del negocio.",
    highlights: [
      "Slug único, timezone y currency.",
      "Color de marca y estado del negocio.",
      "Base lista para permisos finos y selector de cuenta más adelante.",
    ],
  },
};
