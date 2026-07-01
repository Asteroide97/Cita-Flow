export type NavLink = {
  label: string;
  href: string;
};

export type Metric = {
  value: string;
  label: string;
  note?: string;
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
  useCaseTitle: string;
  useCaseSummary: string;
  useCaseSteps: string[];
  useCaseMetrics: Metric[];
};

export type PatientFlowStep = {
  step: string;
  title: string;
  description: string;
};

export type PatientBookingSummary = {
  service: string;
  doctor: string;
  date: string;
  advance: string;
  buttonLabel: string;
};

export type ResultMetric = {
  value: string;
  label: string;
  description: string;
  note: string;
};

export type Testimonial = {
  quote: string;
  name: string;
  role: string;
  impact: string;
};

export type PricingFeature = {
  title: string;
  description: string;
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
  {
    value: "24/7",
    label: "reservas abiertas",
    note: "aunque no respondas mensajes",
  },
  {
    value: "Menos ausencias",
    label: "más asistencia",
    note: "con recordatorios y anticipos",
  },
  {
    value: "+ ocupación",
    label: "más horarios útiles",
    note: "menos huecos por cancelación",
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
    title: "Valoración inicial",
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

export const problemCards: Problem[] = [
  {
    title: "Agenda llena de mensajes manuales",
    description:
      "Tu equipo termina respondiendo horarios, cambios y recordatorios durante todo el día.",
  },
  {
    title: "Clientes que no confirman",
    description:
      "Las reservas quedan en el aire y tu agenda se vuelve incierta hasta el último momento.",
  },
  {
    title: "Horarios vacíos por cancelaciones",
    description:
      "Cuando alguien cancela tarde, cuesta mucho volver a llenar ese espacio disponible.",
  },
  {
    title: "Reagendar consume demasiado tiempo",
    description:
      "Mover una reserva implica mensajes, llamadas y cruces entre servicios y profesionales.",
  },
  {
    title: "Anticipos difíciles de controlar",
    description:
      "Cobrar apartados y saber quién ya pagó suele hacerse de forma manual y dispersa.",
  },
  {
    title: "Poca visibilidad del negocio",
    description:
      "Sin métricas claras es difícil saber qué horarios se pierden y qué servicios se llenan mejor.",
  },
];

export const howItWorksSteps: HowStep[] = [
  {
    number: "01",
    title: "Configura tu negocio",
    description:
      "Carga servicios, duración, profesionales, horarios y reglas básicas de anticipo.",
  },
  {
    number: "02",
    title: "Comparte tu enlace de reservas",
    description:
      "Envíalo por WhatsApp, Instagram, Google Business o tu página web.",
  },
  {
    number: "03",
    title: "El cliente reserva",
    description:
      "Elige servicio, profesional y horario en pocos pasos, sin llamadas ni ida y vuelta.",
  },
  {
    number: "04",
    title: "CitaFlow automatiza el seguimiento",
    description:
      "Envía recordatorios, registra anticipos y recupera horarios liberados con lista de espera.",
  },
];

export const clinicTypes: ClinicType[] = [
  {
    id: "clinicas-consultorios",
    label: "Clínicas y consultorios",
    tagline: "Reservas ordenadas para equipos que viven de una agenda activa y bien coordinada.",
    description:
      "Centraliza servicios, profesionales y confirmaciones sin depender del chat para cada espacio.",
    benefits: [
      "Reservas online 24/7",
      "Recordatorios por WhatsApp",
      "Anticipos para reducir ausencias",
      "Agenda por profesional",
      "Clientes organizados",
    ],
    highlight: "Ideal para negocios con varios servicios, horarios y atención continua.",
    support: "Reduce coordinación manual y mejora la ocupación de la agenda.",
    useCaseTitle: "Caso de uso sugerido",
    useCaseSummary:
      "Un negocio de salud o atención presencial puede publicar reservas por servicio y atender mejor sin saturar recepción.",
    useCaseSteps: [
      "Configura servicios y duraciones",
      "Comparte un solo enlace de reservas",
      "Confirma y recupera horarios liberados",
    ],
    useCaseMetrics: [
      { value: "24/7", label: "reservas abiertas" },
      { value: "Multi", label: "servicio y profesional" },
      { value: "1 enlace", label: "captación directa" },
    ],
  },
  {
    id: "dental",
    label: "Dental",
    tagline: "Limpiezas, valoraciones y tratamientos protegidos con menos huecos entre pacientes.",
    description:
      "Organiza servicios por duración y anticipo sin perder seguimiento ni tiempo en recepción.",
    benefits: [
      "Reservas online 24/7",
      "Anticipos para procedimientos de alto valor",
      "Recordatorios automáticos",
      "Lista de espera inteligente",
      "Agenda por profesional",
    ],
    highlight: "Muy útil para tratamientos con tiempos distintos y alta demanda.",
    support: "Ayuda a proteger espacios que cuesta mucho recuperar.",
    useCaseTitle: "Caso de uso sugerido",
    useCaseSummary:
      "Una clínica dental puede separar valoración, limpieza y seguimiento con reglas simples de confirmación.",
    useCaseSteps: [
      "Publica servicios por duración",
      "Pide anticipo cuando convenga",
      "Rellena huecos con lista de espera",
    ],
    useCaseMetrics: [
      { value: "3", label: "servicios base" },
      { value: "2", label: "tipos de anticipo" },
      { value: "Más orden", label: "menos seguimiento manual" },
    ],
  },
  {
    id: "psicologia",
    label: "Psicología",
    tagline: "Sesiones recurrentes con una agenda más estable y menos fricción para reservar.",
    description:
      "Asegura continuidad semanal con recordatorios discretos y horarios claros para tus clientes.",
    benefits: [
      "Reservas online 24/7",
      "Recordatorios por WhatsApp",
      "Agenda por profesional",
      "Clientes organizados",
      "Notificaciones automáticas",
    ],
    highlight: "Favorece la constancia en negocios donde la continuidad es clave.",
    support: "Reduce cancelaciones silenciosas y mejora la estabilidad de la semana.",
    useCaseTitle: "Caso de uso sugerido",
    useCaseSummary:
      "Un centro terapéutico puede proteger sesiones recurrentes sin volver compleja la experiencia de reserva.",
    useCaseSteps: [
      "Abre horarios recurrentes",
      "Confirma automáticamente",
      "Reagenda más rápido cuando cambia un bloque",
    ],
    useCaseMetrics: [
      { value: "Semanal", label: "ritmo de reserva" },
      { value: "1 clic", label: "confirmación simple" },
      { value: "Multi", label: "terapeuta opcional" },
    ],
  },
  {
    id: "fisioterapia",
    label: "Fisioterapia",
    tagline: "Sesiones seriadas, bloques largos y mejor control del tiempo productivo.",
    description:
      "Coordina valoraciones y seguimientos sin perder disponibilidad ni saturar al equipo.",
    benefits: [
      "Agenda por profesional",
      "Reservas online 24/7",
      "Recordatorios automáticos",
      "Lista de espera inteligente",
      "Clientes organizados",
    ],
    highlight: "Protege mejor horarios largos que se desperdician si alguien falta.",
    support: "Ayuda a sostener continuidad y uso eficiente del espacio.",
    useCaseTitle: "Caso de uso sugerido",
    useCaseSummary:
      "Un centro de fisioterapia puede ordenar valoraciones y seguimientos en una sola agenda visible.",
    useCaseSteps: [
      "Separa valoraciones y seguimientos",
      "Carga bloques largos por sesión",
      "Recupera cancelaciones con espera",
    ],
    useCaseMetrics: [
      { value: "45-60 min", label: "bloques frecuentes" },
      { value: "Serie", label: "continuidad" },
      { value: "Más ocupación", label: "menos huecos" },
    ],
  },
  {
    id: "spa-estetica",
    label: "Spa y estética",
    tagline: "Experiencia premium desde la reserva hasta el anticipo del servicio.",
    description:
      "Convierte interés en reservas confirmadas con una experiencia clara y más comercial.",
    benefits: [
      "Anticipos para reducir ausencias",
      "Reservas online 24/7",
      "Recordatorios por WhatsApp",
      "Agenda por profesional",
      "Notificaciones automáticas",
    ],
    highlight: "Ideal para servicios de alto valor o alta demanda.",
    support: "Funciona muy bien para captar desde Instagram y WhatsApp.",
    useCaseTitle: "Caso de uso sugerido",
    useCaseSummary:
      "Un spa puede publicar faciales, masajes o valoraciones con una experiencia más ordenada desde el primer clic.",
    useCaseSteps: [
      "Publica servicios con duración clara",
      "Protege espacios con anticipos",
      "Envía recordatorios antes del servicio",
    ],
    useCaseMetrics: [
      { value: "Premium", label: "servicios protegidos" },
      { value: "1 enlace", label: "captación directa" },
      { value: "Más asistencia", label: "menos ausencias" },
    ],
  },
  {
    id: "barberias",
    label: "Barberías",
    tagline: "Cortes más organizados, menos interrupciones y mejor ritmo diario.",
    description:
      "Abre reservas por profesional y evita perder tiempo respondiendo horarios uno por uno.",
    benefits: [
      "Agenda por profesional",
      "Reservas online 24/7",
      "Recordatorios por WhatsApp",
      "Clientes organizados",
      "Lista de espera inteligente",
    ],
    highlight: "Muy útil cuando el negocio depende de velocidad, rotación y puntualidad.",
    support: "Reduce chat repetitivo y ayuda a mantener la silla ocupada.",
    useCaseTitle: "Caso de uso sugerido",
    useCaseSummary:
      "Una barbería puede distribuir reservas entre varios profesionales y ordenar mejor sus bloques del día.",
    useCaseSteps: [
      "Muestra profesionales disponibles",
      "Deja que el cliente reserve solo",
      "Rellena cancelaciones con lista de espera",
    ],
    useCaseMetrics: [
      { value: "Rápido", label: "flujo de reserva" },
      { value: "Multi", label: "barbero activo" },
      { value: "Menos chat", label: "más foco en atención" },
    ],
  },
  {
    id: "salones",
    label: "Salones de belleza",
    tagline: "Más control sobre color, corte y agenda por profesional sin caos operativo.",
    description:
      "Coordina reservas por duración, profesional y tipo de servicio en una sola experiencia.",
    benefits: [
      "Agenda por profesional",
      "Reservas online 24/7",
      "Recordatorios por WhatsApp",
      "Anticipos para citas largas",
      "Clientes organizados",
    ],
    highlight: "Perfecto para servicios que mezclan duración, preparación y alta ocupación.",
    support: "Ayuda a ordenar días intensos y a reducir cambios de último minuto.",
    useCaseTitle: "Caso de uso sugerido",
    useCaseSummary:
      "Un salón puede separar corte, color, peinado o maquillaje con tiempos distintos y más control comercial.",
    useCaseSteps: [
      "Define servicios por duración",
      "Asigna agenda por profesional",
      "Protege citas largas con anticipos",
    ],
    useCaseMetrics: [
      { value: "Flexible", label: "duración por servicio" },
      { value: "Más orden", label: "menos cruces manuales" },
      { value: "Alta demanda", label: "agenda mejor cuidada" },
    ],
  },
  {
    id: "veterinarias",
    label: "Veterinarias",
    tagline: "Consultas, controles y valoraciones con una agenda más clara para el equipo.",
    description:
      "Ordena servicios, horarios y recordatorios para atender mejor sin depender del teléfono.",
    benefits: [
      "Reservas online 24/7",
      "Agenda por profesional",
      "Recordatorios por WhatsApp",
      "Clientes organizados",
      "Notificaciones automáticas",
    ],
    highlight: "Mejora la coordinación diaria cuando llegan consultas, controles y urgencias leves.",
    support: "Reduce llamadas repetitivas y mejora la experiencia del cliente.",
    useCaseTitle: "Caso de uso sugerido",
    useCaseSummary:
      "Una veterinaria puede ordenar revisiones, vacunas o seguimientos con una agenda más predecible.",
    useCaseSteps: [
      "Configura servicios frecuentes",
      "Activa recordatorios automáticos",
      "Consulta disponibilidad real por profesional",
    ],
    useCaseMetrics: [
      { value: "24/7", label: "captación" },
      { value: "Más claridad", label: "menos llamadas" },
      { value: "Mejor servicio", label: "cliente informado" },
    ],
  },
  {
    id: "entrenadores-clases",
    label: "Entrenadores y clases",
    tagline: "Sesiones más ordenadas, grupos mejor coordinados y menos tiempo cerrando por chat.",
    description:
      "Permite reservar por profesional, sesión o clase con una agenda más visible y fácil de mantener.",
    benefits: [
      "Reservas online 24/7",
      "Agenda por profesional",
      "Recordatorios automáticos",
      "Lista de espera inteligente",
      "Clientes organizados",
    ],
    highlight: "Ideal para sesiones individuales o grupos donde la puntualidad importa mucho.",
    support: "Ayuda a sostener ocupación y continuidad sin perseguir confirmaciones.",
    useCaseTitle: "Caso de uso sugerido",
    useCaseSummary:
      "Un entrenador puede abrir bloques por sesión y reacomodar mejor los horarios que se liberan.",
    useCaseSteps: [
      "Define horarios por sesión",
      "Abre agenda por profesional",
      "Envía recordatorios automáticos",
    ],
    useCaseMetrics: [
      { value: "Individual o grupo", label: "múltiples formatos" },
      { value: "Más asistencia", label: "mejor seguimiento" },
      { value: "Menos chat", label: "menos coordinación manual" },
    ],
  },
  {
    id: "centros-deportivos",
    label: "Centros deportivos",
    tagline: "Agenda más clara para servicios, clases y atención por profesional o área.",
    description:
      "Centraliza reservas de entrenamiento, evaluación o atención especializada en un mismo flujo.",
    benefits: [
      "Reservas online 24/7",
      "Agenda por profesional",
      "Lista de espera inteligente",
      "Recordatorios por WhatsApp",
      "Notificaciones automáticas",
    ],
    highlight: "Funciona bien cuando hay varios espacios, entrenadores o servicios simultáneos.",
    support: "Hace más simple distribuir horarios y mantener mejor ocupación.",
    useCaseTitle: "Caso de uso sugerido",
    useCaseSummary:
      "Un centro deportivo puede combinar clases, sesiones y valoraciones con una agenda más operable.",
    useCaseSteps: [
      "Publica servicios y clases",
      "Filtra por profesional o área",
      "Recupera huecos con espera",
    ],
    useCaseMetrics: [
      { value: "Multi", label: "servicio y espacio" },
      { value: "24/7", label: "reservas abiertas" },
      { value: "Más ocupación", label: "menos huecos" },
    ],
  },
];

export const patientFlowSteps: PatientFlowStep[] = [
  {
    step: "01",
    title: "Elige servicio",
    description: "Tu cliente entiende qué necesita desde la primera pantalla.",
  },
  {
    step: "02",
    title: "Selecciona profesional",
    description: "Ve quién atiende y en qué horario, sin mensajes de ida y vuelta.",
  },
  {
    step: "03",
    title: "Escoge horario",
    description: "Solo aparecen espacios reales y disponibles.",
  },
  {
    step: "04",
    title: "Confirma datos",
    description: "Comparte nombre y contacto en un flujo simple y rápido.",
  },
  {
    step: "05",
    title: "Paga anticipo si aplica",
    description: "Confirma su lugar con un pago rápido antes de cerrar la reserva.",
  },
];

export const patientBookingSummary: PatientBookingSummary = {
  service: "Color y peinado",
  doctor: "Sofía Herrera",
  date: "Jueves 18 de julio · 4:30 PM",
  advance: "$200 MXN",
  buttonLabel: "Confirmar reserva",
};

export const resultMetrics: ResultMetric[] = [
  {
    value: "Hasta 67%",
    label: "menos ausencias",
    description:
      "Recordatorios y anticipos ayudan a que más clientes sí lleguen a su reserva.",
    note: "según el tipo de servicio y el flujo de confirmación",
  },
  {
    value: "24/7",
    label: "reservas disponibles",
    description:
      "Tus clientes pueden reservar fuera del horario de atención y sin esperar respuesta.",
    note: "ideal para captar demanda fuera de horario",
  },
  {
    value: "Más ocupación",
    label: "menos huecos perdidos",
    description:
      "Lista de espera y reagendado rápido reducen espacios desperdiciados por cambios de último momento.",
    note: "muy útil en agendas de alta demanda",
  },
  {
    value: "Menos seguimiento",
    label: "menos tiempo en chat",
    description:
      "Tu equipo se enfoca en atender mejor, no en perseguir confirmaciones todo el día.",
    note: "menos coordinación manual por WhatsApp",
  },
];

export const testimonials: Testimonial[] = [
  {
    quote:
      "Antes cerrábamos casi todo por mensajes. Con un enlace de reservas y recordatorios, el equipo recuperó tiempo y la agenda se volvió mucho más estable.",
    name: "Carla Mendoza",
    role: "Directora de spa · Monterrey",
    impact: "Menos seguimiento manual y mejor ocupación",
  },
  {
    quote:
      "Nos ayudó mucho en servicios donde perder un espacio cuesta caro. El anticipo y la lista de espera le dieron más orden a la operación.",
    name: "Javier Rosales",
    role: "Dueño de barbería · Guadalajara",
    impact: "Más control sobre horarios liberados",
  },
  {
    quote:
      "Lo que más valoramos fue lo claro que se siente para el cliente. La reserva se ve mucho más profesional desde el primer contacto.",
    name: "Mariana Solís",
    role: "Coordinadora de fisioterapia · CDMX",
    impact: "Experiencia más consistente para el cliente",
  },
];

export const pricingFeatures: PricingFeature[] = [
  {
    title: "Página pública de reservas",
    description: "Tu negocio recibe reservas sin depender de mensajes manuales.",
  },
  {
    title: "Agenda centralizada",
    description: "Horarios, servicios y disponibilidad en un solo flujo.",
  },
  {
    title: "Recordatorios automáticos",
    description: "Confirmaciones y avisos previos sin seguimiento manual.",
  },
  {
    title: "Gestión de clientes",
    description: "Base de contactos organizada para seguir creciendo el producto.",
  },
  {
    title: "Servicios y profesionales",
    description: "Diferencia roles, duraciones y disponibilidad.",
  },
  {
    title: "Anticipos con Stripe",
    description: "Protege horarios de alto valor con cobros de apartado.",
  },
  {
    title: "Lista de espera inteligente",
    description: "Recupera huecos por cancelación de forma más ordenada.",
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
      "No necesariamente. Puedes evaluar el flujo comercial primero y activar cobros o suscripción cuando decidas operar formalmente con CitaFlow.",
  },
  {
    question: "¿Puedo cobrar anticipos?",
    answer:
      "Sí. CitaFlow está pensado para permitir anticipos por servicio o tipo de reserva cuando quieras proteger espacios de alto valor.",
  },
  {
    question: "¿Funciona con WhatsApp?",
    answer:
      "Sí. La idea es que compartas tu enlace de reservas por WhatsApp y que tu cliente reserve sin coordinación manual.",
  },
  {
    question: "¿Puedo usarlo con varios profesionales?",
    answer:
      "Sí. El flujo está planteado para operar con uno o varios profesionales dentro del mismo negocio.",
  },
  {
    question: "¿Mis clientes necesitan crear cuenta?",
    answer:
      "No. La experiencia está diseñada para reservar en pocos pasos y sin fricción innecesaria.",
  },
  {
    question: "¿Puedo cancelar cuando quiera?",
    answer:
      "Sí. El plan está pensado como una suscripción simple, sin permanencias forzosas y con control total desde tu lado.",
  },
  {
    question: "¿Se integra con Google Calendar?",
    answer:
      "Sí, está considerado en el roadmap de producto para sincronizar disponibilidad y eventos sin duplicar trabajo.",
  },
];

export const footerLinks = [
  { label: "Producto", href: "#beneficios" },
  { label: "Precios", href: "#precios" },
  { label: "Soporte", href: "mailto:hola@citaflow.app" },
  { label: "Privacidad", href: "#footer" },
  { label: "Términos", href: "#footer" },
];
