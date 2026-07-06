export type DemoChecklistItem = {
  id: string;
  label: string;
};

export type DemoChecklistGroup = {
  id: string;
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
  items: DemoChecklistItem[];
};

export const demoChecklistGroups: DemoChecklistGroup[] = [
  {
    id: "landing",
    title: "Landing",
    description: "Revisa marca, mensaje y CTA principal.",
    actionHref: "/",
    actionLabel: "Abrir landing",
    items: [
      { id: "landing-branding", label: "Branding Agenda Viva visible" },
      { id: "landing-cta", label: "CTA visible" },
      { id: "landing-copy", label: "Copy multiindustria" },
    ],
  },
  {
    id: "auth",
    title: "Auth",
    description: "Valida acceso y alta inicial.",
    actionHref: "/login",
    actionLabel: "Abrir login",
    items: [
      { id: "auth-login-demo", label: "Login demo funciona" },
      { id: "auth-register", label: "Registro crea negocio" },
      { id: "auth-logout", label: "Logout funciona" },
    ],
  },
  {
    id: "settings",
    title: "Configuración",
    description: "Confirma identidad pública del negocio.",
    actionHref: "/app/settings",
    actionLabel: "Ir a configuración",
    items: [
      { id: "settings-public-name", label: "Nombre público" },
      { id: "settings-slug", label: "Slug" },
      { id: "settings-color", label: "Color" },
      { id: "settings-contact", label: "Contacto" },
      { id: "settings-public-link", label: "Link público" },
    ],
  },
  {
    id: "booking",
    title: "Booking público",
    description: "Verifica la experiencia pública y la separación de flujos.",
    actionHref: "/booking/clinica-demo",
    actionLabel: "Abrir booking",
    items: [
      { id: "booking-service", label: "Servicio visible" },
      { id: "booking-professional", label: "Profesional visible" },
      { id: "booking-slots", label: "Horarios reales" },
      { id: "booking-pending", label: "Reserva pendiente" },
      { id: "booking-waitlist", label: "Lista de espera separada" },
    ],
  },
  {
    id: "panel",
    title: "Panel",
    description: "Recorre los módulos principales del panel.",
    actionHref: "/app/dashboard",
    actionLabel: "Ir al panel",
    items: [
      { id: "panel-dashboard", label: "Dashboard operativo" },
      { id: "panel-appointments", label: "Reservas" },
      { id: "panel-calendar", label: "Agenda" },
      { id: "panel-patients", label: "Clientes" },
      { id: "panel-services", label: "Servicios" },
      { id: "panel-doctors", label: "Profesionales" },
      { id: "panel-waitlist", label: "Lista de espera" },
      { id: "panel-notifications", label: "Notificaciones" },
      { id: "panel-reports", label: "Reportes" },
    ],
  },
  {
    id: "operations",
    title: "Operación",
    description: "Prueba acciones operativas sobre reservas y disponibilidad.",
    actionHref: "/app/calendar",
    actionLabel: "Abrir agenda",
    items: [
      { id: "ops-create-panel", label: "Crear reserva desde panel" },
      { id: "ops-create-calendar", label: "Crear reserva desde agenda" },
      { id: "ops-reschedule", label: "Reagendar" },
      { id: "ops-cancel", label: "Cancelar" },
      { id: "ops-complete", label: "Completar" },
      { id: "ops-no-show", label: "No-show" },
      { id: "ops-block-time", label: "Bloquear horario" },
      { id: "ops-time-off", label: "Ausencia de profesional" },
    ],
  },
  {
    id: "pending",
    title: "Pendiente",
    description: "Temas fuera de demo que siguen abiertos.",
    items: [
      { id: "pending-meta", label: "Meta Cloud API" },
      { id: "pending-templates", label: "WhatsApp templates" },
      { id: "pending-stripe", label: "Stripe anticipos" },
      { id: "pending-domain", label: "Dominio final" },
      { id: "pending-demo-email", label: "Cambio de correo demo" },
      { id: "pending-legal", label: "Revisión legal de marca" },
    ],
  },
];
