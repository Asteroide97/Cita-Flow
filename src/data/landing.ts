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
  { label: "Como funciona", href: "#como-funciona" },
  { label: "Precios", href: "#precios" },
  { label: "FAQ", href: "#faq" },
];

export const heroMetrics: Metric[] = [
  {
    value: "Hasta 67%",
    label: "menos ausencias",
    note: "con recordatorios y anticipo",
  },
  {
    value: "24/7",
    label: "reservas abiertas",
    note: "aunque recepcion no este conectada",
  },
  {
    value: "+ ocupacion",
    label: "mas horarios utiles",
    note: "menos huecos por cancelacion",
  },
];

export const heroAlerts: HeroAlert[] = [
  {
    label: "Anticipo pagado",
    detail: "Implantologia · 11:30",
    tone: "emerald",
  },
  {
    label: "Recordatorio enviado",
    detail: "Consulta general · manana",
    tone: "sky",
  },
  {
    label: "Cita confirmada",
    detail: "Psicologia · 4:00 PM",
    tone: "brand",
  },
];

export const heroAppointments: HeroAppointment[] = [
  {
    hour: "09:00",
    title: "Valoracion dental",
    detail: "Dra. Cortes · 45 min",
    state: "Confirmada",
  },
  {
    hour: "11:30",
    title: "Primera consulta",
    detail: "Dr. Nunez · Anticipo recibido",
    state: "Pagada",
  },
  {
    hour: "16:00",
    title: "Sesion de seguimiento",
    detail: "Lic. Luna · Recordatorio enviado",
    state: "Lista",
  },
];

export const problemCards: Problem[] = [
  {
    title: "Agenda llena de mensajes manuales",
    description:
      "Recepcion termina respondiendo horarios, cambios y recordatorios durante todo el dia.",
  },
  {
    title: "Pacientes que no confirman",
    description:
      "Las citas quedan en el aire y la agenda se vuelve incierta hasta el ultimo momento.",
  },
  {
    title: "Horarios vacios por cancelaciones",
    description:
      "Cuando alguien cancela tarde, cuesta mucho volver a llenar ese espacio disponible.",
  },
  {
    title: "Reagendar consume demasiado tiempo",
    description:
      "Mover una cita implica mensajes, llamadas y cruces de disponibilidad entre doctores.",
  },
  {
    title: "Pagos de anticipo dificiles de controlar",
    description:
      "Cobrar apartados y rastrear quien ya pago suele hacerse de forma manual y dispersa.",
  },
  {
    title: "Falta de visibilidad del consultorio",
    description:
      "Sin metricas claras es dificil saber que horarios se pierden y que servicios se llenan.",
  },
];

export const howItWorksSteps: HowStep[] = [
  {
    number: "01",
    title: "Configura tu consultorio",
    description:
      "Carga servicios, horarios, duracion de citas, doctores y politicas de anticipos.",
  },
  {
    number: "02",
    title: "Comparte tu enlace de reserva",
    description:
      "Envia una sola liga por WhatsApp, Instagram, Google Business o tu pagina web.",
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
      "Organiza tratamientos por duracion, anticipos y seguimiento sin saturar a recepcion.",
    benefits: [
      "Reservas online por tratamiento y duracion",
      "Anticipos para ortodoncia, implantes y estetica dental",
      "Recordatorios antes de limpiezas y revisiones",
      "Lista de espera para llenar cancelaciones rapidas",
      "Bloques por sillon o especialista cuando haga falta",
    ],
    highlight:
      "Ideal para tratamientos con tiempos distintos y alta demanda de seguimiento.",
    support:
      "Reduce llamadas repetitivas para confirmar limpiezas, valoraciones y controles.",
    useCaseTitle: "Caso de uso sugerido",
    useCaseSummary:
      "Una clinica dental puede publicar valoracion, limpieza y seguimiento con reglas distintas de duracion y anticipo.",
    useCaseSteps: [
      "Valoracion inicial con anticipo opcional",
      "Limpiezas y revisiones con recordatorio automatico",
      "Tratamientos largos protegidos con apartados",
    ],
    useCaseMetrics: [
      { value: "3", label: "servicios base" },
      { value: "2", label: "tipos de anticipo" },
      { value: "1 enlace", label: "reserva publica" },
    ],
  },
  {
    id: "medico-general",
    label: "Medico general",
    tagline: "Consulta diaria mas ordenada, con confirmaciones y menos huecos inesperados.",
    description:
      "Facilita reservas continuas, consultas de seguimiento y disponibilidad mas clara para pacientes.",
    benefits: [
      "Reservas online para consulta general y seguimiento",
      "Confirmaciones automaticas antes de la cita",
      "Anticipos opcionales para primeras visitas o espacios criticos",
      "Reagenda en minutos cuando cambia la disponibilidad",
      "Historial simple de pacientes listo para crecer en fases futuras",
    ],
    highlight:
      "Manten el ritmo de consulta sin depender del chat para coordinar cada horario.",
    support:
      "Perfecto para consultorios que hoy atienden casi todo por telefono o WhatsApp.",
    useCaseTitle: "Caso de uso sugerido",
    useCaseSummary:
      "Un consultorio general puede diferenciar primera consulta, seguimiento y urgencia sin volver compleja la operacion.",
    useCaseSteps: [
      "Primera visita con datos del paciente y motivo de consulta",
      "Seguimientos cortos con recordatorio el mismo dia",
      "Espacios reservados para urgencias o huecos rapidos",
    ],
    useCaseMetrics: [
      { value: "24/7", label: "agenda abierta" },
      { value: "2", label: "tipos de consulta" },
      { value: "1 equipo", label: "menos seguimiento manual" },
    ],
  },
  {
    id: "psicologia",
    label: "Psicologia",
    tagline: "Sesiones recurrentes, mayor privacidad y menos seguimiento manual.",
    description:
      "Asegura continuidad semanal con recordatorios discretos y cobros de apartado cuando aplique.",
    benefits: [
      "Reservas recurrentes con horarios consistentes",
      "Anticipos para apartar sesiones de alta demanda",
      "Recordatorios respetuosos y automaticos",
      "Reagenda rapida ante cambios de ultimo momento",
      "Control sencillo para varios terapeutas",
    ],
    highlight:
      "Muy util cuando el valor esta en la constancia de la agenda y la continuidad clinica.",
    support: "Reduce cancelaciones silenciosas y mejora la estabilidad de la semana.",
    useCaseTitle: "Caso de uso sugerido",
    useCaseSummary:
      "Una practica psicologica puede proteger sesiones recurrentes y mantener la privacidad con un flujo simple para el paciente.",
    useCaseSteps: [
      "Sesion inicial con disponibilidad clara",
      "Seguimientos semanales con confirmacion automatica",
      "Reagenda agil cuando un bloque cambia",
    ],
    useCaseMetrics: [
      { value: "Semanal", label: "ritmo de seguimiento" },
      { value: "1 clic", label: "confirmacion de cita" },
      { value: "Multi", label: "terapeuta opcional" },
    ],
  },
  {
    id: "fisioterapia",
    label: "Fisioterapia",
    tagline: "Mas control de sesiones seriadas y mejor uso del tiempo clinico.",
    description:
      "Coordina valoraciones, terapias de seguimiento y bloques largos sin perder disponibilidad.",
    benefits: [
      "Servicios por sesion individual o paquetes de seguimiento",
      "Anticipos para primeras valoraciones o bonos",
      "Recordatorios previos a terapias seriadas",
      "Lista de espera para rellenar espacios cancelados",
      "Agenda por especialista o cabina",
    ],
    highlight:
      "Ayuda a proteger horarios largos que son dificiles de recuperar si se pierden.",
    support:
      "Evita que el staff invierta horas persiguiendo confirmaciones o reacomodos.",
    useCaseTitle: "Caso de uso sugerido",
    useCaseSummary:
      "La fisioterapia necesita cuidar sesiones largas, cabinas y continuidad semanal sin dejar espacios improductivos.",
    useCaseSteps: [
      "Valoracion inicial con tiempo extendido",
      "Terapias seriadas con recordatorio previo",
      "Lista de espera para recuperar huecos",
    ],
    useCaseMetrics: [
      { value: "45-60 min", label: "bloques frecuentes" },
      { value: "Serie", label: "seguimiento continuo" },
      { value: "1 cabina", label: "control por recurso" },
    ],
  },
  {
    id: "estetica",
    label: "Estetica",
    tagline: "Experiencia premium desde la reserva hasta el anticipo del tratamiento.",
    description:
      "Convierte interes en cita confirmada con flujos claros para procedimientos, valoracion y seguimiento.",
    benefits: [
      "Reservas online con servicios y promociones activas",
      "Anticipos para tratamientos premium o de alta demanda",
      "Recordatorios con preparacion previa de la cita",
      "Agenda optimizada para bloques largos o combinados",
      "Lista de espera para llenar cancelaciones rentables",
    ],
    highlight:
      "Potencia servicios donde el anticipo protege ingresos y mejora la asistencia.",
    support:
      "Muy util para equipos que venden por Instagram, WhatsApp y campanas locales.",
    useCaseTitle: "Caso de uso sugerido",
    useCaseSummary:
      "Una clinica estetica puede publicar valoraciones, tratamientos premium y promociones sin perder sensacion de control comercial.",
    useCaseSteps: [
      "Valoracion inicial con enlace compartible",
      "Anticipo para tratamientos de alta demanda",
      "Seguimiento claro antes y despues de la cita",
    ],
    useCaseMetrics: [
      { value: "Premium", label: "servicios protegidos" },
      { value: "1 enlace", label: "captacion directa" },
      { value: "Pago", label: "apartado integrado" },
    ],
  },
  {
    id: "clinicas",
    label: "Clinicas",
    tagline: "Varios doctores, servicios y recepcionistas operando bajo un mismo flujo.",
    description:
      "Centraliza agenda multi-doctor y disponibilidad compartida sin depender de hojas o mensajes cruzados.",
    benefits: [
      "Agenda multi-doctor con servicios diferenciados",
      "Anticipos por sede, especialidad o tipo de cita",
      "Recordatorios automaticos a gran escala",
      "Lista de espera para distintos especialistas",
      "Mas visibilidad operativa para administracion",
    ],
    highlight:
      "Pensado para operaciones con mas complejidad y necesidad de coordinacion central.",
    support:
      "Evita dobles reservas, cuellos de botella y perdida de tiempo entre recepcion y medicos.",
    useCaseTitle: "Caso de uso sugerido",
    useCaseSummary:
      "Una clinica con varias especialidades puede centralizar disponibilidad, recepcion y confirmaciones sin depender de procesos manuales.",
    useCaseSteps: [
      "Reserva por servicio, sede o especialista",
      "Confirmaciones automaticas para cada agenda",
      "Vista operativa mas clara para administracion",
    ],
    useCaseMetrics: [
      { value: "Multi", label: "doctor y servicio" },
      { value: "Central", label: "operacion visible" },
      { value: "24/7", label: "captacion de citas" },
    ],
  },
];

export const patientFlowSteps: PatientFlowStep[] = [
  {
    step: "01",
    title: "Elige servicio",
    description: "El paciente entiende que cita necesita desde la primera pantalla.",
  },
  {
    step: "02",
    title: "Selecciona doctor",
    description: "Si hay varios especialistas, ve quien atiende y en que horario.",
  },
  {
    step: "03",
    title: "Escoge horario",
    description: "Solo aparecen espacios reales y disponibles, sin doble coordinacion.",
  },
  {
    step: "04",
    title: "Confirma datos",
    description: "Comparte nombre, contacto y motivo de visita en un flujo simple.",
  },
  {
    step: "05",
    title: "Paga anticipo si aplica",
    description: "Confirma su lugar con un pago rapido antes de cerrar la reserva.",
  },
];

export const patientBookingSummary: PatientBookingSummary = {
  service: "Primera consulta de valoracion",
  doctor: "Dra. Sofia Herrera",
  date: "Jueves 18 de julio · 4:30 PM",
  advance: "$200 MXN",
  buttonLabel: "Confirmar reserva",
};

export const resultMetrics: ResultMetric[] = [
  {
    value: "Hasta 67%",
    label: "menos ausencias",
    description:
      "Recordatorios y politicas de anticipo ayudan a que mas pacientes si lleguen.",
    note: "segun el tipo de cita y el flujo de confirmacion",
  },
  {
    value: "24/7",
    label: "reservas disponibles",
    description:
      "Tus pacientes pueden agendar fuera del horario de recepcion y sin esperar respuesta.",
    note: "ideal para captar citas fuera de oficina",
  },
  {
    value: "Mas ocupacion",
    label: "menos huecos perdidos",
    description:
      "Lista de espera y reagendado rapido reducen espacios desperdiciados por cambios de ultimo momento.",
    note: "especialmente en tratamientos con alta demanda",
  },
  {
    value: "Menos seguimiento",
    label: "menos tiempo en chat",
    description:
      "El equipo se enfoca en atender mejor, no en perseguir confirmaciones todo el dia.",
    note: "menos coordinacion manual por WhatsApp",
  },
];

export const testimonials: Testimonial[] = [
  {
    quote:
      "Antes confirmabamos casi todo por mensajes. Con un enlace de reserva y recordatorios, recepcion recupero tiempo y la agenda se volvio mucho mas estable.",
    name: "Dra. Marcela Pineda",
    role: "Medico general · Monterrey",
    impact: "Menos confirmaciones manuales en recepcion",
  },
  {
    quote:
      "Nos ayudo mucho en tratamientos donde perder un espacio cuesta caro. El anticipo y la lista de espera le dieron mas orden a la operacion.",
    name: "Lic. Andrea Tellez",
    role: "Administradora de clinica dental · Guadalajara",
    impact: "Mejor control de huecos y tratamientos",
  },
  {
    quote:
      "Lo que mas valoramos fue la sensacion de proceso claro para el paciente. La reserva se siente mas profesional desde el primer contacto.",
    name: "Dr. Rafael Cornejo",
    role: "Director de clinica de fisioterapia · CDMX",
    impact: "Experiencia mas consistente para el paciente",
  },
];

export const pricingFeatures: PricingFeature[] = [
  {
    title: "Pagina publica de reservas",
    description: "Tu consultorio recibe citas sin depender de mensajes manuales.",
  },
  {
    title: "Agenda medica centralizada",
    description: "Horarios, servicios y disponibilidad en un solo flujo.",
  },
  {
    title: "Recordatorios automaticos",
    description: "Confirmaciones y avisos previos sin seguimiento manual.",
  },
  {
    title: "Gestion de pacientes",
    description: "Datos basicos del paciente listos para futuras fases del producto.",
  },
  {
    title: "Servicios y doctores",
    description: "Diferencia especialidades, duraciones y disponibilidad.",
  },
  {
    title: "Anticipos con Stripe",
    description: "Protege horarios de alto valor con cobros de apartado.",
  },
  {
    title: "Lista de espera",
    description: "Recupera huecos por cancelacion de forma mas ordenada.",
  },
  {
    title: "Soporte basico",
    description: "Acompanamiento inicial para operar la landing comercial.",
  },
];

export const faqs: Faq[] = [
  {
    question: "¿Necesito tarjeta para empezar?",
    answer:
      "No necesariamente. Puedes comenzar evaluando el flujo comercial y activar cobros o suscripcion cuando decidas operar formalmente con CitaFlow.",
  },
  {
    question: "¿Puedo cobrar anticipos?",
    answer:
      "Si. CitaFlow esta pensado para permitir anticipos por servicio o tipo de cita cuando quieras proteger espacios de alto valor.",
  },
  {
    question: "¿Funciona con WhatsApp?",
    answer:
      "Si. La idea es que compartas tu enlace de reserva por WhatsApp y que el paciente complete la cita sin coordinacion manual.",
  },
  {
    question: "¿Puedo usarlo con varios doctores?",
    answer:
      "Si. El flujo esta planteado para operar con uno o varios especialistas dentro del mismo consultorio o clinica.",
  },
  {
    question: "¿Mis pacientes necesitan crear cuenta?",
    answer:
      "No. La experiencia esta diseñada para reservar en pocos pasos y sin friccion innecesaria para el paciente.",
  },
  {
    question: "¿Puedo cancelar cuando quiera?",
    answer:
      "Si. El plan esta planteado como una suscripcion simple, sin permanencias forzosas y con control total desde tu lado.",
  },
  {
    question: "¿Se integra con Google Calendar?",
    answer:
      "Si, esta considerado como parte del roadmap de producto para sincronizar disponibilidad y eventos sin duplicar trabajo.",
  },
];

export const footerLinks = [
  { label: "Producto", href: "#beneficios" },
  { label: "Precios", href: "#precios" },
  { label: "Soporte", href: "mailto:hola@citaflow.app" },
  { label: "Privacidad", href: "#footer" },
  { label: "Terminos", href: "#footer" },
];
