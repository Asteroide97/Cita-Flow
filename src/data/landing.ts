export type NavLink = {
  label: string;
  href: string;
};

export type Metric = {
  value: string;
  label: string;
};

export type Problem = {
  title: string;
  description: string;
};

export type HowStep = {
  number: string;
  title: string;
  description: string;
};

export type ClinicType = {
  id: string;
  label: string;
  tagline: string;
  description: string;
  benefits: string[];
  highlight: string;
  support: string;
};

export type PatientFlowStep = {
  step: string;
  title: string;
  description: string;
};

export type ResultMetric = {
  value: string;
  label: string;
  description: string;
};

export type Testimonial = {
  quote: string;
  name: string;
  role: string;
};

export type Faq = {
  question: string;
  answer: string;
};

export const navigationLinks: NavLink[] = [
  { label: "Beneficios", href: "#beneficios" },
  { label: "Cómo funciona", href: "#como-funciona" },
  { label: "Precios", href: "#precios" },
  { label: "FAQ", href: "#faq" },
];

export const heroMetrics: Metric[] = [
  { value: "67%", label: "menos no-shows" },
  { value: "24/7", label: "reservas disponibles" },
  { value: "+ocupación", label: "más horarios llenos" },
];

export const problemCards: Problem[] = [
  {
    title: "Agenda llena de mensajes manuales",
    description:
      "Recepción termina respondiendo horarios, cambios y recordatorios durante todo el día.",
  },
  {
    title: "Pacientes que no confirman",
    description:
      "Las citas quedan en el aire y la agenda se vuelve incierta hasta el último momento.",
  },
  {
    title: "Horarios vacíos por cancelaciones",
    description:
      "Cuando alguien cancela tarde, cuesta mucho volver a llenar ese espacio disponible.",
  },
  {
    title: "Reagendar consume demasiado tiempo",
    description:
      "Mover una cita implica mensajes, llamadas y cruces de disponibilidad entre doctores.",
  },
  {
    title: "Pagos de anticipo difíciles de controlar",
    description:
      "Cobrar apartados y rastrear quién ya pagó suele hacerse de forma manual y dispersa.",
  },
  {
    title: "Falta de visibilidad del consultorio",
    description:
      "Sin métricas claras es difícil saber qué horarios se pierden y qué servicios se llenan.",
  },
];

export const howItWorksSteps: HowStep[] = [
  {
    number: "01",
    title: "Configura tu consultorio",
    description:
      "Carga servicios, horarios, duración de citas, doctores y políticas de anticipos.",
  },
  {
    number: "02",
    title: "Comparte tu enlace de reserva",
    description:
      "Envía una sola liga por WhatsApp, Instagram, Google Business o tu página web.",
  },
  {
    number: "03",
    title: "El paciente agenda y confirma",
    description:
      "Elige servicio, doctor y horario en pocos pasos, sin llamadas ni mensajes de ida y vuelta.",
  },
  {
    number: "04",
    title: "CitaFlow recuerda, cobra y reorganiza",
    description:
      "Automatiza recordatorios, anticipos y lista de espera para mantener la agenda activa.",
  },
];

export const clinicTypes: ClinicType[] = [
  {
    id: "dental",
    label: "Dental",
    tagline: "Tratamientos, limpiezas y urgencias con menos huecos entre pacientes.",
    description:
      "Organiza tratamientos por duración, anticipos y seguimiento sin saturar a recepción.",
    benefits: [
      "Reservas online por tratamiento y duración",
      "Anticipos para ortodoncia, implantes y estética dental",
      "Recordatorios antes de limpiezas y revisiones",
      "Lista de espera para llenar cancelaciones rápidas",
      "Bloques por sillón o especialista cuando haga falta",
    ],
    highlight: "Ideal para tratamientos con tiempos distintos y alta demanda de seguimiento.",
    support: "Reduce llamadas repetitivas para confirmar limpiezas, valoraciones y controles.",
  },
  {
    id: "medico-general",
    label: "Médico general",
    tagline: "Consulta diaria más ordenada, con confirmaciones y menos huecos inesperados.",
    description:
      "Facilita reservas continuas, consultas de seguimiento y disponibilidad más clara para pacientes.",
    benefits: [
      "Reservas online para consulta general y seguimiento",
      "Confirmaciones automáticas antes de la cita",
      "Anticipos opcionales para primeras visitas o espacios críticos",
      "Reagenda en minutos cuando cambia la disponibilidad",
      "Historial simple de pacientes listo para crecer en fases futuras",
    ],
    highlight: "Mantén el ritmo de consulta sin depender del chat para coordinar cada horario.",
    support: "Perfecto para consultorios que hoy atienden casi todo por teléfono o WhatsApp.",
  },
  {
    id: "psicologia",
    label: "Psicología",
    tagline: "Sesiones recurrentes, mayor privacidad y menos seguimiento manual.",
    description:
      "Asegura continuidad semanal con recordatorios discretos y cobros de apartado cuando aplique.",
    benefits: [
      "Reservas recurrentes con horarios consistentes",
      "Anticipos para apartar sesiones de alta demanda",
      "Recordatorios respetuosos y automáticos",
      "Reagenda rápida ante cambios de último momento",
      "Control sencillo para varios terapeutas",
    ],
    highlight: "Muy útil cuando el valor está en la constancia de la agenda y la continuidad clínica.",
    support: "Reduce cancelaciones silenciosas y mejora la estabilidad de la semana.",
  },
  {
    id: "fisioterapia",
    label: "Fisioterapia",
    tagline: "Más control de sesiones seriadas y mejor uso del tiempo clínico.",
    description:
      "Coordina valoraciones, terapias de seguimiento y bloques largos sin perder disponibilidad.",
    benefits: [
      "Servicios por sesión individual o paquetes de seguimiento",
      "Anticipos para primeras valoraciones o bonos",
      "Recordatorios previos a terapias seriadas",
      "Lista de espera para rellenar espacios cancelados",
      "Agenda por especialista o cabina",
    ],
    highlight: "Ayuda a proteger horarios largos que son difíciles de recuperar si se pierden.",
    support: "Evita que el staff invierta horas persiguiendo confirmaciones o reacomodos.",
  },
  {
    id: "estetica",
    label: "Estética",
    tagline: "Experiencia premium desde la reserva hasta el anticipo del tratamiento.",
    description:
      "Convierte interés en cita confirmada con flujos claros para procedimientos, valoración y seguimiento.",
    benefits: [
      "Reservas online con servicios y promociones activas",
      "Anticipos para tratamientos premium o de alta demanda",
      "Recordatorios con preparación previa de la cita",
      "Agenda optimizada para bloques largos o combinados",
      "Lista de espera para llenar cancelaciones rentables",
    ],
    highlight: "Potencia servicios donde el anticipo protege ingresos y mejora la asistencia.",
    support: "Muy útil para equipos que venden por Instagram, WhatsApp y campañas locales.",
  },
  {
    id: "clinicas",
    label: "Clínicas",
    tagline: "Varios doctores, servicios y recepcionistas operando bajo un mismo flujo.",
    description:
      "Centraliza agenda multi-doctor y disponibilidad compartida sin depender de hojas o mensajes cruzados.",
    benefits: [
      "Agenda multi-doctor con servicios diferenciados",
      "Anticipos por sede, especialidad o tipo de cita",
      "Recordatorios automáticos a gran escala",
      "Lista de espera para distintos especialistas",
      "Más visibilidad operativa para administración",
    ],
    highlight: "Pensado para operaciones con más complejidad y necesidad de coordinación central.",
    support: "Evita dobles reservas, cuellos de botella y pérdida de tiempo entre recepción y médicos.",
  },
];

export const patientFlowSteps: PatientFlowStep[] = [
  {
    step: "01",
    title: "Elige servicio",
    description: "El paciente entiende qué cita necesita desde la primera pantalla.",
  },
  {
    step: "02",
    title: "Selecciona doctor",
    description: "Si hay varios especialistas, ve quién atiende y en qué horario.",
  },
  {
    step: "03",
    title: "Escoge horario",
    description: "Solo aparecen espacios reales y disponibles, sin doble coordinación.",
  },
  {
    step: "04",
    title: "Confirma datos",
    description: "Comparte nombre, contacto y motivo de visita en un flujo simple.",
  },
  {
    step: "05",
    title: "Paga anticipo si aplica",
    description: "Confirma su lugar con un pago rápido antes de cerrar la reserva.",
  },
];

export const resultMetrics: ResultMetric[] = [
  {
    value: "67%",
    label: "menos no-shows",
    description: "Recordatorios y anticipos ayudan a que más pacientes sí lleguen.",
  },
  {
    value: "24/7",
    label: "reservas disponibles",
    description: "Tus pacientes pueden agendar fuera del horario de recepción.",
  },
  {
    value: "+horarios",
    label: "más ocupados",
    description: "Lista de espera y reagendado rápido reducen espacios desperdiciados.",
  },
  {
    value: "-WhatsApp",
    label: "menos tiempo coordinando",
    description: "El equipo se enfoca en atender, no en perseguir confirmaciones.",
  },
];

export const testimonials: Testimonial[] = [
  {
    quote:
      "Antes perdíamos varios espacios por pacientes que no respondían. Con recordatorios y anticipo, la agenda se volvió mucho más estable.",
    name: "Dra. Marcela Pineda",
    role: "Médico general · Monterrey",
  },
  {
    quote:
      "La recepción dejó de pasar horas confirmando citas por chat. Ahora compartimos un enlace y el paciente hace casi todo solo.",
    name: "Lic. Andrea Téllez",
    role: "Administradora de clínica dental · Guadalajara",
  },
  {
    quote:
      "Lo que más nos ayudó fue recuperar huecos de último momento con la lista de espera y los cambios automáticos.",
    name: "Dr. Rafael Cornejo",
    role: "Director de clínica de fisioterapia · CDMX",
  },
];

export const pricingFeatures: string[] = [
  "Página pública de reservas",
  "Agenda médica",
  "Recordatorios automáticos",
  "Gestión de pacientes",
  "Servicios y doctores",
  "Anticipos con Stripe",
  "Lista de espera",
  "Soporte básico",
];

export const faqs: Faq[] = [
  {
    question: "¿Necesito tarjeta para empezar?",
    answer:
      "No necesariamente. Puedes comenzar evaluando el flujo comercial y activar cobros o suscripción cuando decidas operar formalmente con CitaFlow.",
  },
  {
    question: "¿Puedo cobrar anticipos?",
    answer:
      "Sí. CitaFlow está pensado para permitir anticipos por servicio o tipo de cita cuando quieras proteger espacios de alto valor.",
  },
  {
    question: "¿Funciona con WhatsApp?",
    answer:
      "Sí. La idea es que compartas tu enlace de reserva por WhatsApp y que el paciente complete la cita sin coordinación manual.",
  },
  {
    question: "¿Puedo usarlo con varios doctores?",
    answer:
      "Sí. El flujo está planteado para operar con uno o varios especialistas dentro del mismo consultorio o clínica.",
  },
  {
    question: "¿Mis pacientes necesitan crear cuenta?",
    answer:
      "No. La experiencia está diseñada para reservar en pocos pasos y sin fricción innecesaria para el paciente.",
  },
  {
    question: "¿Puedo cancelar cuando quiera?",
    answer:
      "Sí. El plan está planteado como una suscripción simple, sin permanencias forzosas y con control total desde tu lado.",
  },
  {
    question: "¿Se integra con Google Calendar?",
    answer:
      "Sí, está considerado como parte del roadmap de producto para sincronizar disponibilidad y eventos sin duplicar trabajo.",
  },
];

export const footerLinks = [
  { label: "Producto", href: "#beneficios" },
  { label: "Precios", href: "#precios" },
  { label: "Soporte", href: "mailto:hola@citaflow.app" },
  { label: "Privacidad", href: "#footer" },
  { label: "Términos", href: "#footer" },
];
