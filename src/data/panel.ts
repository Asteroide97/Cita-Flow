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
    description: "Resumen operativo del consultorio.",
  },
  {
    label: "Agenda",
    href: "/app/calendar",
    shortLabel: "AG",
    description: "Vista general de horarios y disponibilidad.",
  },
  {
    label: "Citas",
    href: "/app/appointments",
    shortLabel: "CT",
    description: "Seguimiento de confirmaciones y estados.",
  },
  {
    label: "Pacientes",
    href: "/app/patients",
    shortLabel: "PA",
    description: "Base inicial de pacientes por clinic.",
  },
  {
    label: "Doctores",
    href: "/app/doctors",
    shortLabel: "DR",
    description: "Equipo medico y especialidades.",
  },
  {
    label: "Servicios",
    href: "/app/services",
    shortLabel: "SV",
    description: "Catalogo base de servicios y duraciones.",
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
    label: "Configuracion",
    href: "/app/settings",
    shortLabel: "CF",
    description: "Tenant, branding y parametros del clinic.",
  },
];

export const dashboardMetrics: DashboardMetric[] = [
  {
    label: "Citas de hoy",
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
    note: "ultimos 30 dias",
    tone: "amber",
  },
  {
    label: "Pacientes nuevos",
    value: "18",
    note: "captados este mes",
    tone: "slate",
  },
];

export const panelSections: Record<string, PanelSectionContent> = {
  calendar: {
    title: "Agenda",
    description:
      "Aqui vivira la vista operativa de calendario con disponibilidad, doctores y reacomodos.",
    highlights: [
      "Calendario diario, semanal y por doctor.",
      "Bloqueos de horario y disponibilidad por clinic.",
      "Reagendado y estados de cita en tiempo real.",
    ],
  },
  appointments: {
    title: "Citas",
    description:
      "Esta seccion concentrara confirmaciones, cancelaciones, origen de cita y seguimiento operativo.",
    highlights: [
      "Listado por estado y rango de fechas.",
      "Filtros por doctor, servicio y source.",
      "Acciones futuras de confirmar, reagendar y cancelar.",
    ],
  },
  patients: {
    title: "Pacientes",
    description:
      "Base inicial de pacientes por clinic, con datos de contacto y notas internas.",
    highlights: [
      "Buscador de pacientes por nombre, telefono y email.",
      "Historial de citas por paciente.",
      "Notas privadas para recepcion y staff.",
    ],
  },
  doctors: {
    title: "Doctores",
    description:
      "Catalogo del equipo medico, con especialidades y futura asignacion de agenda.",
    highlights: [
      "Relacion opcional entre doctor y user del sistema.",
      "Especialidad, bio y estado activo.",
      "Preparado para agenda multi-doctor.",
    ],
  },
  services: {
    title: "Servicios",
    description:
      "Catalogo base del clinic con duracion, precios y reglas futuras de anticipos.",
    highlights: [
      "Duracion estandar por servicio.",
      "Precio y anticipo opcional por cita.",
      "Preparado para reservas y pagina publica futura.",
    ],
  },
  notifications: {
    title: "Notificaciones",
    description:
      "Outbox transaccional por clinica para preparar mensajes de WhatsApp y email antes de conectar proveedores reales.",
    highlights: [
      "Mensajes pendientes, enviados, fallidos o cancelados.",
      "Templates internos con contexto de cita y enlaces publicos.",
      "Base lista para conectar Meta Cloud API y email mas adelante.",
    ],
  },
  waitlist: {
    title: "Lista de espera",
    description:
      "Solicitudes publicas para ocupar espacios liberados con matching por servicio, doctor y preferencia horaria.",
    highlights: [
      "Entradas activas, ofertadas, convertidas o expiradas.",
      "Ofertas publicas con expiracion y aceptacion por token.",
      "Base lista para conectar recordatorios y canales reales despues.",
    ],
  },
  settings: {
    title: "Configuracion",
    description:
      "Zona base del tenant para branding, datos legales y parametros generales del clinic.",
    highlights: [
      "Slug unico, timezone y currency.",
      "Color de marca y estado del clinic.",
      "Base lista para permisos finos y selector de clinic mas adelante.",
    ],
  },
};
