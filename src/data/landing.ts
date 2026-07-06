import { brand, brandSupportMailto } from "@/lib/brand";

export type PublicNavLink = {
  label: string;
  href: string;
};

export type HeroMetric = {
  value: string;
  label: string;
  note: string;
};

export type HeroAlert = {
  label: string;
  detail: string;
  tone: "emerald" | "sky" | "brand";
};

export type HeroAppointment = {
  hour: string;
  title: string;
  detail: string;
  state: string;
};

export type BenefitItem = {
  title: string;
  description: string;
};

export type StepItem = {
  title: string;
  description: string;
};

export type BusinessSolution = {
  id: string;
  label: string;
  summary: string;
  highlight: string;
};

export type ProductModule = {
  title: string;
  description: string;
};

export type PricingFeature = {
  title: string;
  description: string;
};

export type Faq = {
  question: string;
  answer: string;
};

export const publicNavigationLinks: PublicNavLink[] = [
  { label: "Inicio", href: "/" },
  { label: "Producto", href: "/producto" },
  { label: "Soluciones", href: "/soluciones" },
  { label: "Precios", href: "/precios" },
  { label: "FAQ", href: "/faq" },
];

export const heroMetrics: HeroMetric[] = [
  {
    value: "24/7",
    label: "reservas activas",
    note: "aunque no estés respondiendo mensajes",
  },
  {
    value: "Menos ausencias",
    label: "más asistencia",
    note: "con recordatorios y anticipos",
  },
  {
    value: "Más ocupación",
    label: "menos huecos perdidos",
    note: "con lista de espera y reagendado",
  },
];

export const heroAlerts: HeroAlert[] = [
  {
    label: "Anticipo pagado",
    detail: "Color premium · 11:30",
    tone: "emerald",
  },
  {
    label: "Recordatorio enviado",
    detail: "Sesión funcional · mañana",
    tone: "sky",
  },
  {
    label: "Reserva confirmada",
    detail: "Corte y barba · 4:00 PM",
    tone: "brand",
  },
];

export const heroAppointments: HeroAppointment[] = [
  {
    hour: "09:00",
    title: "Corte premium",
    detail: "Sofía Herrera · 45 min",
    state: "Confirmada",
  },
  {
    hour: "11:30",
    title: "Servicio completo",
    detail: "Diego Campos · Anticipo recibido",
    state: "Pagada",
  },
  {
    hour: "16:00",
    title: "Sesión funcional",
    detail: "Luna Vera · Recordatorio enviado",
    state: "Lista",
  },
];

export const homeBenefits: BenefitItem[] = [
  {
    title: "Reservas 24/7",
    description: "Recibe solicitudes aunque tu equipo no esté contestando.",
  },
  {
    title: "Recordatorios automáticos",
    description: "Reduce ausencias sin perseguir confirmaciones por chat.",
  },
  {
    title: "Lista de espera",
    description: "Recupera horarios liberados con un flujo más ordenado.",
  },
  {
    title: "Agenda por profesional",
    description: "Controla disponibilidad real por persona y servicio.",
  },
  {
    title: "Clientes organizados",
    description: "Centraliza historial, contacto y próximas reservas.",
  },
  {
    title: "Reportes básicos",
    description: "Detecta ocupación, cancelaciones y servicios con más demanda.",
  },
];

export const homeSteps: StepItem[] = [
  {
    title: "Configura tu negocio",
    description: "Carga servicios, profesionales y horarios disponibles.",
  },
  {
    title: "Comparte tu link",
    description: "Publícalo en WhatsApp, Instagram, Google o tu sitio web.",
  },
  {
    title: "Recibe reservas",
    description: "Tus clientes eligen servicio, horario y confirman sus datos.",
  },
];

export const businessSolutions: BusinessSolution[] = [
  {
    id: "clinicas-consultorios",
    label: "Clínicas y consultorios",
    summary: "Ordena servicios, confirmaciones y horarios sin depender del chat.",
    highlight: "Ideal para equipos con varios servicios y atención continua.",
  },
  {
    id: "dental",
    label: "Dental",
    summary: "Protege tratamientos con anticipos y reduce huecos costosos.",
    highlight: "Muy útil cuando cada bloque tiene alto valor.",
  },
  {
    id: "psicologia",
    label: "Psicología",
    summary: "Sostén sesiones recurrentes con una agenda más estable.",
    highlight: "Mejora continuidad y reduce cancelaciones silenciosas.",
  },
  {
    id: "fisioterapia",
    label: "Fisioterapia",
    summary: "Coordina valoraciones y seguimientos con disponibilidad real.",
    highlight: "Funciona bien para sesiones largas y seriadas.",
  },
  {
    id: "spa-estetica",
    label: "Spa y estética",
    summary: "Convierte interés en reservas confirmadas con una experiencia premium.",
    highlight: "Ayuda a proteger servicios de alto valor con anticipos.",
  },
  {
    id: "barberias",
    label: "Barberías",
    summary: "Mantén la silla ocupada con reservas rápidas por profesional.",
    highlight: "Reduce mensajes repetitivos y mejora el ritmo diario.",
  },
  {
    id: "salones",
    label: "Salones de belleza",
    summary: "Organiza corte, color y peinado en una sola agenda comercial.",
    highlight: "Perfecto para servicios con duraciones distintas.",
  },
  {
    id: "veterinarias",
    label: "Veterinarias",
    summary: "Da claridad a consultas, controles y revisiones frecuentes.",
    highlight: "Mejora la experiencia del cliente sin depender del teléfono.",
  },
  {
    id: "entrenadores-clases",
    label: "Entrenadores y clases",
    summary: "Abre sesiones individuales o grupales con mejor control del horario.",
    highlight: "Ayuda a sostener asistencia y continuidad semanal.",
  },
  {
    id: "centros-deportivos",
    label: "Centros deportivos",
    summary: "Centraliza clases, servicios y profesionales en un solo flujo.",
    highlight: "Muy útil cuando operas varios espacios o áreas al mismo tiempo.",
  },
];

export const productModules: ProductModule[] = [
  {
    title: "Reservas online",
    description: "Comparte un link y deja que el cliente reserve sin fricción.",
  },
  {
    title: "Agenda visual",
    description: "Consulta el día o la semana con horarios reales por profesional.",
  },
  {
    title: "Clientes",
    description: "Mantén cada contacto con historial, próximas reservas y notas.",
  },
  {
    title: "Profesionales",
    description: "Controla visibilidad pública, orden y disponibilidad semanal.",
  },
  {
    title: "Servicios",
    description: "Define duración, precio, anticipo y orden del catálogo público.",
  },
  {
    title: "Lista de espera",
    description: "Recupera horarios liberados sin volver al caos de los mensajes.",
  },
  {
    title: "Notificaciones",
    description: "Prepara recordatorios y mensajes transaccionales desde una cola segura.",
  },
  {
    title: "Reportes",
    description: "Mide reservas, cancelaciones, no-show y demanda por servicio.",
  },
  {
    title: "Panel operativo",
    description: "Administra reservas, agenda y operación diaria desde un solo lugar.",
  },
];

export const pricingFeatures: PricingFeature[] = [
  {
    title: "Reservas online",
    description: "Un link público para recibir reservas sin coordinar por chat.",
  },
  {
    title: "Agenda",
    description: "Vista diaria y semanal con horarios reales por profesional.",
  },
  {
    title: "Clientes",
    description: "Base organizada con historial, próximas reservas y contacto.",
  },
  {
    title: "Profesionales",
    description: "Configura perfiles, visibilidad pública y disponibilidad.",
  },
  {
    title: "Servicios",
    description: "Ordena tu catálogo con duración, precio y anticipo opcional.",
  },
  {
    title: "Lista de espera",
    description: "Recupera espacios que se liberan sin seguimiento manual.",
  },
  {
    title: "Notificaciones",
    description: "Mensajes preparados para WhatsApp y email desde la cola interna.",
  },
  {
    title: "Reportes básicos",
    description: "Métricas simples para entender ocupación, cancelaciones y demanda.",
  },
  {
    title: "Soporte básico",
    description: "Acompañamiento inicial para ordenar tu operación.",
  },
];

export const faqs: Faq[] = [
  {
    question: "¿Necesito tarjeta para empezar?",
    answer:
      "No. Puedes probar el flujo comercial primero y decidir después cómo operar formalmente con Agenda Viva.",
  },
  {
    question: "¿Puedo cobrar anticipos?",
    answer:
      `${brand.name} ya contempla anticipos por servicio para proteger horarios de mayor valor.`,
  },
  {
    question: "¿Funciona con WhatsApp?",
    answer:
      "Sí. Puedes compartir tu link por WhatsApp y el producto ya prepara notificaciones transaccionales para futuras integraciones.",
  },
  {
    question: "¿Puedo usarlo con varios profesionales?",
    answer:
      "Sí. Agenda Viva está pensado para operar con uno o varios profesionales dentro del mismo negocio.",
  },
  {
    question: "¿Mis clientes necesitan crear cuenta?",
    answer:
      "No. La experiencia pública está pensada para reservar en pocos pasos y sin crear usuario.",
  },
  {
    question: "¿Puedo cancelar cuando quiera?",
    answer:
      "Sí. El plan está planteado como una suscripción simple, sin permanencias forzosas.",
  },
  {
    question: "¿Se integra con Google Calendar?",
    answer:
      "Todavía no. Está contemplado para una fase posterior del producto.",
  },
];

export const footerLinks = [
  { label: "Producto", href: "/producto" },
  { label: "Soluciones", href: "/soluciones" },
  { label: "Precios", href: "/precios" },
  { label: "FAQ", href: "/faq" },
  { label: "Soporte", href: brandSupportMailto },
];
