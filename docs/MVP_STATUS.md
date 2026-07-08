# Agenda Viva - Estado del MVP

Actualizado: 2026-07-08

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
- Confirmacion por email preparada con soporte de calendario.

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
- El booking publico sigue creando reservas con estado inicial `PENDING`

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

- Calendario operativo tipo Google Calendar ya validado
- Calendario operativo mas pulido visualmente
- Crear reserva desde calendario funciona
- Crear reserva desde hueco disponible
- Crear reserva desde hueco disponible funciona
- Ver agenda por dia y semana
- Ver agenda por mes
- Ver bloqueos generales
- Los bloqueos generales afectan el booking publico
- Las ausencias de profesionales afectan el booking publico
- Reagendar desde agenda
- Reagendado desde agenda funciona
- Ejecutar acciones rapidas
- El doble submit no duplica reservas

## Validacion reciente de calendario y booking

- El calendario operativo tipo Google Calendar ya fue validado
- El calendario operativo quedo mas pulido visualmente para uso diario
- Crear reserva desde calendario funciona
- Crear reserva desde hueco disponible funciona
- Bloqueos generales afectan el booking publico
- Ausencias de profesionales afectan el booking publico
- Reagendado desde agenda funciona
- Booking publico crea reservas `PENDING`
- El doble submit no duplica reservas
- Responsive corregido en `/app/calendar` y `/booking/[clinicSlug]`

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

## Confirmacion por email preparada

Estado actual:

- Existe base para confirmacion por email desde `NotificationOutbox`
- El booking publico ya muestra el boton `Agregar a calendario`
- El autoservicio publico por token tambien puede mostrar `Agregar a calendario`
- Se genera archivo `.ics` desde ruta publica validada por token
- Existe link web preparado para Google Calendar
- El envio automatico de email sigue desactivado hasta configurar proveedor

Ruta tecnica nueva:

- `/api/calendar/appointments/[appointmentId]/ics`

## Meta Cloud API pausado

Estado actual:

- Existe cliente tecnico de Meta
- Existe webhook base en `/api/meta/whatsapp/webhook`
- Existen variables de entorno documentadas
- Existen acciones manuales de desarrollo

Regla actual:

- No activar envio automatico todavia
- No venderlo como WhatsApp real ya activo
- Meta Cloud API sigue pausado
- Email real y WhatsApp real siguen en modo manual o preparado, no automatico

## Que no se debe tocar por ahora

- No cambiar `schema.prisma` salvo necesidad critica
- No cambiar rutas publicas ya usadas en demo
- No activar envio automatico real por WhatsApp
- No conectar Twilio
- No conectar Stripe todavia
- No conectar Google Calendar todavia
- Los pagos automaticos y los anticipos siguen fuera del MVP
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
- `EMAIL_FROM`
- `EMAIL_PROVIDER`
- `RESEND_API_KEY`
- `NODE_ENV`

## Pendientes antes de demo comercial

- Revisar el flujo publico completo en `/`, `/producto`, `/soluciones`, `/precios` y `/faq`
- Validar login demo
- Validar booking publico de `clinica-demo`
- Validar lista de espera separada del booking
- Validar creacion de reserva desde panel y desde agenda
- Validar boton `Agregar a calendario` desde booking y autoservicio
- Revisar que `NEXT_PUBLIC_APP_URL` apunte al entorno correcto
- Confirmar copy comercial final
- Confirmar que Meta siga visualmente pausado y no genere falsas expectativas
- Confirmar configuracion de proveedor si se quiere probar email real manual
- Revisar datos demo visibles para que se sientan coherentes con el posicionamiento multiindustria

## Pendientes post-demo

- Activar integracion real con Meta Cloud API
- Definir templates reales de WhatsApp
- Conectar proveedor real de email y activar envio automatico si aplica
- Integrar Stripe para anticipos
- Revisar dominio final
- Cambiar el email demo visible cuando deje de ser necesario mantener compatibilidad
- Evaluar selector de multiples negocios por usuario
- Evaluar permisos mas finos por rol
- Evaluar integracion directa con Google Calendar si aporta valor mas alla de `.ics`

## Riesgos conocidos

- `NEXT_PUBLIC_APP_URL` puede seguir apuntando al dominio anterior si no se actualiza por entorno
- El usuario demo sigue siendo `demo@citaflow.app` por compatibilidad actual
- Los nombres internos de modelos siguen siendo medicos (`Doctor`, `Patient`, `Clinic`)
- Meta Cloud API esta implementado solo de forma tecnica parcial
- Email real depende de configurar proveedor y credenciales
- No hay Stripe real todavia
- No hay integracion directa con Google Calendar todavia, solo link web y `.ics`
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
