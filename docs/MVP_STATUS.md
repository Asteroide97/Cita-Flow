# Agenda Viva - Estado del MVP

Actualizado: 2026-07-06

## Resumen del producto

Agenda Viva es una plataforma de reservas para negocios de servicios. El MVP actual ya permite operar un negocio real con:

- Landing publica multiindustria.
- Panel interno protegido por sesion.
- Booking publico por slug del negocio.
- Motor real de disponibilidad por profesional.
- Gestion de reservas, clientes, servicios y profesionales.
- Lista de espera separada del flujo de reserva.
- Outbox de notificaciones.
- Simulador local de WhatsApp.
- Reportes basicos.

El producto ya es demostrable como MVP funcional, pero todavia mantiene integraciones reales pausadas o parciales.

## Que no se debe tocar por ahora

- No cambiar `schema.prisma` salvo necesidad critica.
- No cambiar rutas publicas ya usadas en demo.
- No activar envio automatico real por WhatsApp.
- No conectar Twilio.
- No conectar Stripe todavia.
- No conectar Google Calendar todavia.
- No renombrar modelos internos `Doctor`, `Patient` o `Clinic`.
- No cambiar el email demo `demo@citaflow.app` por ahora.

## Modulos implementados

### Landing publica

- `/`
- Branding Agenda Viva.
- Copy multiindustria.
- Hero, beneficios, FAQ, precios y CTA final.

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
- Reserva publica con disponibilidad real.
- Lista de espera separada del flujo de reserva.

### Autoservicio publico por token

- `/cita/confirmar/[token]`
- `/cita/cancelar/[token]`
- `/cita/reagendar/[token]`

### Lista de espera publica

- `/espera/aceptar/[offerToken]`
- `/espera/rechazar/[offerToken]`

### Meta Cloud API

- Cliente y webhook base implementados.
- Integracion pausada en UI y sin envio automatico.

## Flujos funcionales

### Registro inicial

- Crea `User`, `Clinic` y `ClinicMember` con rol `OWNER`.

### Login y logout

- Login por email y contrasena.
- Logout revoca la sesion.

### Configuracion del negocio

- Nombre del negocio.
- Slug publico.
- Tipo de negocio.
- Zona horaria.
- Moneda.
- Color de marca.
- Nombre y descripcion publica.
- Sitio web, email y telefono de contacto.

### Booking publico

- Elegir servicio.
- Elegir profesional.
- Elegir fecha.
- Ver horarios reales.
- Capturar datos del cliente.
- Crear reserva `PENDING`.

### Lista de espera publica

- Se crea `WaitlistEntry`.
- No crea `Appointment`.
- Muestra confirmacion separada dentro del booking.

### Gestion de reservas desde panel

- Crear reserva manual.
- Confirmar.
- Cancelar.
- Completar.
- Marcar no-show.
- Reagendar.

### Gestion desde agenda

- Crear reserva desde hueco disponible.
- Ver reservas por dia y semana.
- Ver bloqueos generales.
- Ejecutar acciones rapidas.

### Gestion de disponibilidad

- Disponibilidad semanal por profesional.
- Ausencias por profesional.
- Bloqueos generales del negocio.
- Prevencion de traslapes con reservas activas.

### Clientes

- Listado real.
- Filtros.
- Detalle por cliente.
- Edicion de datos.

### Profesionales

- CRUD real.
- Visibilidad publica.
- Orden publico.
- Disponibilidad.

### Servicios

- CRUD real.
- Categoria.
- Visibilidad publica.
- Orden publico.
- Reglas de anticipo a nivel de datos, sin Stripe real.

### WhatsApp simulator

- Simulacion local de conversacion.
- Flujo de reserva deterministico.
- Usa disponibilidad real.

### Notificaciones

- `NotificationOutbox` para WhatsApp y email.
- Creacion de notificaciones pendientes.
- Acciones manuales de desarrollo para marcar estados.

### Reportes

- Metricas por rango.
- Reservas por dia.
- Top de servicios.
- Top de profesionales.
- Top de clientes.

## Infraestructura actual

### Frontend y app

- Next.js 16 con App Router.
- React 19.
- TypeScript.
- Tailwind CSS 4.

### Base de datos

- PostgreSQL.
- Prisma 7.
- `@prisma/adapter-pg`.

### Auth y sesion

- Tabla `Session`.
- Token plano solo en cookie.
- Hash del token en base de datos.

### Multi-tenant

- Aislamiento por `clinicId`.
- Resolucion del negocio actual desde sesion.

### Disponibilidad

- `DoctorAvailability`
- `DoctorTimeOff`
- `ClinicBlockedTime`

### Comunicacion interna

- `NotificationOutbox`
- Modelos de conversacion y mensajes de WhatsApp.
- Webhook base de Meta.

### Seed demo

- Negocio demo.
- Usuario demo.
- Profesionales demo.
- Servicios demo.
- Clientes demo.
- Reservas demo.

## Variables de entorno usadas

- `DATABASE_URL`: conexion principal a PostgreSQL.
- `SHADOW_DATABASE_URL`: usada para migraciones locales de Prisma.
- `NEXT_PUBLIC_APP_URL`: base publica para enlaces absolutos.
- `META_WHATSAPP_ACCESS_TOKEN`: token de Meta Cloud API. Hoy no debe activarse para envio automatico.
- `META_WHATSAPP_PHONE_NUMBER_ID`: ID del numero de WhatsApp en Meta.
- `META_WHATSAPP_API_VERSION`: version del endpoint de Meta.
- `META_WHATSAPP_VERIFY_TOKEN`: token de verificacion del webhook.
- `NODE_ENV`: usada internamente para banderas de desarrollo.

## Pendientes antes de demo

- Confirmar que `npm run lint` y `npm run build` pasan en la rama actual.
- Ejecutar seed demo si la base esta vacia.
- Validar login demo.
- Validar booking publico de `clinica-demo`.
- Validar lista de espera separada del booking.
- Validar creacion de reserva desde panel y desde agenda.
- Revisar que `NEXT_PUBLIC_APP_URL` apunte al entorno correcto si se necesitan enlaces absolutos.
- Revisar copy visible final si se hace otra pasada de branding.

## Pendientes post-demo

- Activar integracion real con Meta Cloud API.
- Definir templates reales de WhatsApp.
- Conectar proveedor real de email si aplica.
- Integrar Stripe para anticipos.
- Revisar dominio final.
- Cambiar el email demo visible cuando deje de ser necesario mantener compatibilidad.
- Evaluar selector de multiples negocios por usuario.
- Evaluar permisos mas finos por rol.

## Meta Cloud API pausado

### Estado actual

- Existe cliente tecnico de Meta.
- Existe webhook base en `/api/meta/whatsapp/webhook`.
- Existen variables de entorno documentadas.
- Existen acciones manuales desde notificaciones.

### Estado deseado mas adelante

- Envio real desde `NotificationOutbox`.
- Templates aprobados.
- Entrada real de mensajes hacia el motor conversacional.
- Automatizacion controlada por negocio.

### Regla actual

- No activar envio automatico todavia.

## Riesgos conocidos

- `NEXT_PUBLIC_APP_URL` puede seguir apuntando al dominio anterior si no se actualiza por entorno.
- El usuario demo sigue siendo `demo@citaflow.app` por compatibilidad actual.
- Los nombres internos de modelos siguen siendo medicos (`Doctor`, `Patient`, `Clinic`), aunque la UI ya habla de profesionales, clientes y negocio.
- Meta Cloud API esta implementado solo de forma tecnica parcial; no debe venderse como envio real activo.
- No hay Stripe ni cobro de anticipos real todavia.
- No hay integracion con Google Calendar todavia.
- El producto depende de seed demo o datos minimos para una demo convincente.

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
- Revisar el checklist manual
- Confirmar login demo
- Confirmar booking publico
- Confirmar panel, agenda y notificaciones
