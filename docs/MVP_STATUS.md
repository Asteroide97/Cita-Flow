# Agenda Viva - Estado del MVP

Actualizado: 2026-07-06

## Resumen del producto

Agenda Viva es una plataforma de reservas para negocios de servicios. El MVP ya cubre la operacion base de un negocio que vive de su agenda:

- Captacion con landing publica.
- Booking publico por slug del negocio.
- Reserva interna desde panel y calendario.
- Disponibilidad real por profesional.
- Clientes, servicios y profesionales.
- Lista de espera separada del booking.
- Notificaciones en cola.
- Dashboard operativo y reportes basicos.

El producto ya es demostrable. Las integraciones externas mas sensibles siguen pausadas o parciales.

## Branding actual

- Marca visible actual: `Agenda Viva`
- Tagline base: `Agenda Viva automatiza reservas, recordatorios y horarios liberados para negocios de servicios.`
- La fuente central de marca sigue siendo `src/lib/brand.ts`

## Capa publica implementada

La landing larga ya fue separada en rutas publicas mas claras:

- `/`
  - Home corta y comercial.
  - Hero.
  - Beneficios.
  - Como funciona.
  - Tipos de negocio resumidos.
  - CTA final.

- `/producto`
  - Modulos del producto.
  - Reservas online.
  - Agenda visual.
  - Clientes.
  - Profesionales.
  - Servicios.
  - Lista de espera.
  - Notificaciones.
  - Reportes.
  - Panel operativo.

- `/soluciones`
  - Soluciones por tipo de negocio.
  - Clinicas y consultorios.
  - Dental.
  - Psicologia.
  - Fisioterapia.
  - Spa y estetica.
  - Barberias.
  - Salones.
  - Veterinarias.
  - Entrenadores y clases.
  - Centros deportivos.

- `/precios`
  - Plan unico `Agenda Viva Pro`
  - Precio visible: `$13 USD / mes`

- `/faq`
  - Preguntas frecuentes ordenadas.

## Modulos implementados

### Auth

- `/login`
- `/registro`
- `/logout`
- Sesion persistida en base de datos con cookie `httpOnly`.

### Panel protegido

- `/app/dashboard`
- `/app/appointments`
- `/app/calendar`
- `/app/patients`
- `/app/doctors`
- `/app/services`
- `/app/settings`
- `/app/waitlist`
- `/app/notifications`
- `/app/reports`
- `/app/whatsapp-simulator`
- `/app/qa`

### Booking publico

- `/booking/[clinicSlug]`
- Reserva publica funcional con disponibilidad real.
- Estado inicial `PENDING`.
- Lista de espera separada del flujo de reserva.

### Autoservicio publico por token

- `/cita/confirmar/[token]`
- `/cita/cancelar/[token]`
- `/cita/reagendar/[token]`

### Lista de espera publica

- `/espera/aceptar/[offerToken]`
- `/espera/rechazar/[offerToken]`

## Flujos funcionales

### Registro inicial

- Crea `User`
- Crea `Clinic`
- Crea `ClinicMember` con rol `OWNER`

### Configuracion del negocio

- Nombre del negocio
- Slug publico
- Tipo de negocio
- Zona horaria
- Moneda
- Color de marca
- Nombre publico
- Descripcion publica
- Sitio web
- Email de contacto
- Telefono de contacto

### Booking publico funcional

- Elegir servicio publico y activo
- Elegir profesional publico y activo
- Elegir fecha
- Ver horarios reales
- Capturar datos del cliente
- Crear reserva `PENDING`

### Lista de espera separada

- Se crea `WaitlistEntry`
- No crea `Appointment`
- Muestra confirmacion separada dentro del booking

### Gestion de reservas desde panel

- Crear reserva manual
- Confirmar
- Cancelar
- Completar
- Marcar no-show
- Reagendar

### Gestion desde agenda

- Crear reserva desde hueco disponible
- Ver agenda por dia y semana
- Ver bloqueos generales
- Reagendar desde agenda
- Ejecutar acciones rapidas

## Catalogos publicos implementados

### Servicios

- CRUD real
- Categoria
- Orden publico
- Visibilidad publica
- Impacta directamente `/booking/[clinicSlug]`

### Profesionales

- CRUD real
- Visibilidad publica
- Orden publico
- Avatar o foto
- Disponibilidad real
- Impacta directamente `/booking/[clinicSlug]`

## Dashboard operativo implementado

El dashboard ya funciona como resumen de operacion diaria:

- Checklist de onboarding
- Estado operativo
- Operacion de hoy
- Pendientes de atencion
- Accesos rapidos a agenda, reservas, lista de espera y notificaciones

## Reportes basicos implementados

Ruta:

- `/app/reports`

Incluye:

- Total de reservas
- Confirmadas
- Pendientes
- Canceladas
- Completadas
- No-show
- Clientes nuevos
- Tasa de cancelacion
- Tasa de no-show
- Reservas por dia
- Servicios mas reservados
- Profesionales con mas reservas
- Clientes con mas reservas

## QA checklist implementado

Ruta:

- `/app/qa`

Uso:

- Checklist interno de demo
- Revisa landing, auth, configuracion, booking, panel y pendientes
- Sirve para validar rapidamente si el producto esta listo para mostrarse

## Panel operativo implementado

Estado actual del panel:

- Reservas funcionales
- Agenda visual y operativa
- Clientes con listado, detalle y edicion
- Profesionales con catalogo publico
- Servicios con catalogo publico
- Disponibilidad real
- Bloqueos del negocio
- Lista de espera
- Notificaciones en outbox
- Reportes basicos

## Meta Cloud API pausado

Estado actual:

- Existe cliente tecnico de Meta
- Existe webhook base en `/api/meta/whatsapp/webhook`
- Existen variables de entorno documentadas
- Existen acciones manuales de desarrollo

Regla actual:

- No activar envio automatico todavia
- No venderlo como WhatsApp real ya activo

## Que no se debe tocar por ahora

- No cambiar `schema.prisma` salvo necesidad critica
- No cambiar rutas publicas ya usadas en demo
- No activar envio automatico real por WhatsApp
- No conectar Twilio
- No conectar Stripe todavia
- No conectar Google Calendar todavia
- No renombrar modelos internos `Doctor`, `Patient` o `Clinic`
- No cambiar el email demo `demo@citaflow.app` por ahora

## Infraestructura actual

### Frontend y app

- Next.js 16 con App Router
- React 19
- TypeScript
- Tailwind CSS 4

### Base de datos

- PostgreSQL
- Prisma 7
- `@prisma/adapter-pg`

### Auth y sesion

- Tabla `Session`
- Token plano solo en cookie
- Hash del token en base de datos

### Multi-tenant

- Aislamiento por `clinicId`
- Resolucion del negocio actual desde sesion

### Disponibilidad

- `DoctorAvailability`
- `DoctorTimeOff`
- `ClinicBlockedTime`

### Comunicacion interna

- `NotificationOutbox`
- Modelos de conversacion y mensajes de WhatsApp
- Webhook base de Meta

## Variables de entorno usadas

- `DATABASE_URL`
- `SHADOW_DATABASE_URL`
- `NEXT_PUBLIC_APP_URL`
- `META_WHATSAPP_ACCESS_TOKEN`
- `META_WHATSAPP_PHONE_NUMBER_ID`
- `META_WHATSAPP_API_VERSION`
- `META_WHATSAPP_VERIFY_TOKEN`
- `NODE_ENV`

## Pendientes antes de demo comercial

- Revisar el flujo publico completo en `/`, `/producto`, `/soluciones`, `/precios` y `/faq`
- Validar login demo
- Validar booking publico de `clinica-demo`
- Validar lista de espera separada del booking
- Validar creacion de reserva desde panel y desde agenda
- Revisar que `NEXT_PUBLIC_APP_URL` apunte al entorno correcto
- Confirmar copy comercial final
- Confirmar que Meta siga visualmente pausado y no genere falsas expectativas
- Revisar datos demo visibles para que se sientan coherentes con el posicionamiento multiindustria

## Pendientes post-demo

- Activar integracion real con Meta Cloud API
- Definir templates reales de WhatsApp
- Conectar proveedor real de email si aplica
- Integrar Stripe para anticipos
- Revisar dominio final
- Cambiar el email demo visible cuando deje de ser necesario mantener compatibilidad
- Evaluar selector de multiples negocios por usuario
- Evaluar permisos mas finos por rol
- Evaluar integracion con Google Calendar

## Riesgos conocidos

- `NEXT_PUBLIC_APP_URL` puede seguir apuntando al dominio anterior si no se actualiza por entorno
- El usuario demo sigue siendo `demo@citaflow.app` por compatibilidad actual
- Los nombres internos de modelos siguen siendo medicos (`Doctor`, `Patient`, `Clinic`)
- Meta Cloud API esta implementado solo de forma tecnica parcial
- No hay Stripe real todavia
- No hay integracion con Google Calendar todavia
- El producto depende de seed demo o datos minimos para una demo convincente

## Comandos utiles

### Desarrollo local

- `npm run dev`

### Calidad

- `npm run lint`
- `npm run build`

### Prisma

- `npm run db:generate`
- `npm run db:migrate -- --name <nombre>`
- `npm run db:seed`
- `npm run db:studio`

## Usuario demo

- Email: `demo@citaflow.app`
- Password: `Demo123456`
- Negocio demo: `Negocio Demo`
- Slug demo: `clinica-demo`
- Booking demo: `/booking/clinica-demo`

## Nota operativa

Si se necesita preparar una demo rapida:

- Entrar a `/app/qa`
- Confirmar login demo
- Revisar landing publica separada
- Confirmar booking publico
- Confirmar panel, agenda, dashboard y notificaciones
