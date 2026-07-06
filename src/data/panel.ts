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
    description: "Resumen operativo.",
  },
  {
    label: "Agenda",
    href: "/app/calendar",
    shortLabel: "AG",
    description: "Horarios y disponibilidad.",
  },
  {
    label: "Reservas",
    href: "/app/appointments",
    shortLabel: "RS",
    description: "Estados y seguimiento.",
  },
  {
    label: "Clientes",
    href: "/app/patients",
    shortLabel: "CL",
    description: "Base de clientes.",
  },
  {
    label: "Profesionales",
    href: "/app/doctors",
    shortLabel: "PR",
    description: "Equipo y perfiles.",
  },
  {
    label: "Servicios",
    href: "/app/services",
    shortLabel: "SV",
    description: "Catalogo y duraciones.",
  },
  {
    label: "Reportes",
    href: "/app/reports",
    shortLabel: "RP",
    description: "Metricas del negocio.",
  },
  {
    label: "WhatsApp",
    href: "/app/whatsapp-simulator",
    shortLabel: "WA",
    description: "Simulador local.",
  },
  {
    label: "Notificaciones",
    href: "/app/notifications",
    shortLabel: "NT",
    description: "Cola de mensajes.",
  },
  {
    label: "Lista de espera",
    href: "/app/waitlist",
    shortLabel: "LE",
    description: "Solicitudes y ofertas.",
  },
  {
    label: "Configuracion",
    href: "/app/settings",
    shortLabel: "CF",
    description: "Cuenta y marca.",
  },
];

export const dashboardMetrics: DashboardMetric[] = [
  {
    label: "Reservas de hoy",
    value: "12",
    note: "2 pendientes",
    tone: "brand",
  },
  {
    label: "Ingresos del mes",
    value: "$24,500",
    note: "Placeholder",
    tone: "emerald",
  },
  {
    label: "No-shows",
    value: "3",
    note: "Ultimos 30 dias",
    tone: "amber",
  },
  {
    label: "Clientes nuevos",
    value: "18",
    note: "Este mes",
    tone: "slate",
  },
];

export const panelSections: Record<string, PanelSectionContent> = {
  calendar: {
    title: "Agenda",
    description: "Vista operativa con disponibilidad, bloqueos y reservas.",
    highlights: [
      "Calendario diario, semanal y por profesional.",
      "Bloqueos y disponibilidad por negocio.",
      "Reagendado y estados en tiempo real.",
    ],
  },
  appointments: {
    title: "Reservas",
    description: "Confirmaciones, cancelaciones y seguimiento operativo.",
    highlights: [
      "Listado por estado y fecha.",
      "Filtros por profesional, servicio y origen.",
      "Acciones de confirmar, reagendar y cancelar.",
    ],
  },
  patients: {
    title: "Clientes",
    description: "Base de clientes con contacto e historial.",
    highlights: [
      "Buscador por nombre, telefono y email.",
      "Historial de reservas por cliente.",
      "Notas privadas para el equipo.",
    ],
  },
  doctors: {
    title: "Profesionales",
    description: "Catalogo del equipo de atencion.",
    highlights: [
      "Relacion opcional con user del sistema.",
      "Rol o especialidad y estado activo.",
      "Preparado para agenda multi-profesional.",
    ],
  },
  services: {
    title: "Servicios",
    description: "Catalogo del negocio con duracion y precios.",
    highlights: [
      "Duracion estandar por servicio.",
      "Precio y anticipo opcional.",
      "Preparado para booking publico.",
    ],
  },
  reports: {
    title: "Reportes",
    description: "Vista compacta de volumen, estados y desempeno.",
    highlights: [
      "Metricas de reservas, cancelaciones y no-show.",
      "Top de servicios, profesionales y clientes.",
      "Base lista para crecer a analitica avanzada.",
    ],
  },
  notifications: {
    title: "Notificaciones",
    description: "Outbox para WhatsApp y email.",
    highlights: [
      "Pendientes, enviadas, fallidas o canceladas.",
      "Templates con contexto de reserva.",
      "Lista para conectar proveedores reales.",
    ],
  },
  waitlist: {
    title: "Lista de espera",
    description: "Solicitudes para horarios liberados.",
    highlights: [
      "Entradas activas, ofertadas o expiradas.",
      "Ofertas publicas con expiracion.",
      "Lista para conectar recordatorios reales.",
    ],
  },
  settings: {
    title: "Configuracion",
    description: "Marca y datos generales del negocio.",
    highlights: [
      "Slug unico, zona horaria y moneda.",
      "Color de marca y estado del negocio.",
      "Lista para permisos y selector de cuenta.",
    ],
  },
};
