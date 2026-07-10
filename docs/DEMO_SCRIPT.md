# Agenda Viva - Guion de Demo Comercial

Actualizado: 2026-07-10

## Objetivo

Este documento sirve como guion rapido para mostrar Agenda Viva en una demo comercial de 10 a 15 minutos.

La idea no es enseñar todo el producto en profundidad, sino demostrar que:

- Agenda Viva capta reservas desde una pagina publica.
- El negocio recibe y gestiona esas reservas en un panel operativo.
- La agenda, la disponibilidad, la lista de espera y las notificaciones ya funcionan como flujo integrado.

## Duracion sugerida

- Demo corta: 10 minutos
- Demo completa: 12 a 15 minutos

## Preparacion antes de la demo

- Confirmar que `npm run dev` esta levantado.
- Iniciar sesion con el usuario demo.
- Verificar que `/app/qa` no tenga alertas criticas.
- Verificar que `/booking/clinica-demo` cargue correctamente.
- Confirmar que existan servicios y profesionales visibles.
- Confirmar que la agenda tenga al menos algunas reservas demo.
- Confirmar que `/app/notifications` tenga mensajes en bandeja limpia.
- Confirmar que `/app/reports` cargue sin errores.
- Tener abiertas o listas estas rutas:
  - `/`
  - `/booking/clinica-demo`
  - `/app/dashboard`
  - `/app/calendar`
  - `/app/patients`
  - `/app/services`
  - `/app/doctors`
  - `/app/doctors/doctor_demo_1/availability`
  - `/app/waitlist`
  - `/app/notifications`
  - `/app/reports`
  - `/superadmin`

## Usuario demo

- Email: `demo@citaflow.app`
- Password: `Demo123456`
- Negocio demo: `Negocio Demo`
- Slug publico demo: `clinica-demo`

## Orden recomendado de presentacion

1. Landing
2. Booking publico
3. Reserva creada
4. Agenda
5. Clientes
6. Servicios y profesionales
7. Disponibilidad y bloqueos
8. Lista de espera
9. Notificaciones
10. Reportes
11. Superadmin

## Mensaje marco para abrir la demo

Puedes abrir con algo como:

`Agenda Viva ayuda a negocios de servicios a recibir reservas, organizar su agenda y operar mejor desde un solo panel. En esta demo voy a mostrar el flujo completo: desde la pagina publica hasta la gestion interna del negocio.`

## 1. Landing

Ruta:

- `/`

Que mostrar:

- Marca Agenda Viva
- Hero principal
- Posicionamiento multiindustria
- CTA principal

Que decir:

- Agenda Viva no esta pensada solo para clinicas.
- Sirve para negocios de servicios que viven de su agenda.
- El valor principal es convertir una agenda manual en un sistema de reservas y operacion.

Duracion sugerida:

- 1 minuto

## 2. Booking publico

Ruta:

- `/booking/clinica-demo`

Que mostrar:

- Seleccion de servicio
- Seleccion de profesional
- Dia y horarios reales
- Captura de datos del cliente

Que decir:

- Cada negocio tiene su propio link publico de reservas.
- Solo aparecen servicios y profesionales activos y visibles.
- Los horarios se calculan con disponibilidad real, bloqueos y ausencias.
- El cliente no necesita crear cuenta.

Duracion sugerida:

- 2 minutos

## 3. Reserva creada

Ruta:

- Mantener el flujo dentro de `/booking/clinica-demo`

Que mostrar:

- Confirmacion final
- Estado `PENDING`
- Mensaje de reserva pendiente de confirmacion

Que decir:

- La reserva se crea sin pedir login al cliente.
- El negocio conserva control porque la reserva entra como pendiente.
- Desde aqui ya se dispara la trazabilidad interna en panel y notificaciones.

Duracion sugerida:

- 1 minuto

## 4. Agenda

Ruta:

- `/app/calendar`

Que mostrar:

- Vista dia
- Vista semana o mes si hay tiempo
- Reservas reales
- Creacion rapida desde hueco
- Reagendado o acciones rapidas desde la agenda

Que decir:

- La agenda es el centro operativo del negocio.
- Desde aqui se puede ver la carga del dia y actuar rapido.
- No es solo una vista: tambien permite crear, mover y gestionar reservas.

Duracion sugerida:

- 2 minutos

## 5. Clientes

Ruta:

- `/app/patients`

Que mostrar:

- Lista real de clientes
- Historial basico
- Proxima reserva
- Detalle de cliente si conviene

Que decir:

- Cada reserva alimenta automaticamente la base de clientes.
- El negocio puede ver historial, proxima reserva y contexto operativo.
- Esto evita perder informacion en WhatsApp o en hojas sueltas.

Duracion sugerida:

- 1 minuto

## 6. Servicios y profesionales

Rutas:

- `/app/services`
- `/app/doctors`

Que mostrar:

- Catalogo de servicios
- Visibilidad publica
- Orden publico
- Catalogo de profesionales
- Estado activo y visibilidad

Que decir:

- El negocio controla exactamente que aparece en su pagina publica.
- No todo tiene que estar visible siempre.
- Esto permite adaptar la oferta y el equipo sin tocar codigo.

Duracion sugerida:

- 1 a 2 minutos

## 7. Disponibilidad y bloqueos

Rutas:

- `/app/doctors/doctor_demo_1/availability`
- `/app/calendar`

Que mostrar:

- Disponibilidad semanal del profesional
- Ausencias
- Bloqueos generales del negocio

Que decir:

- Agenda Viva no muestra horarios fijos mockeados.
- Todo depende de disponibilidad real del profesional.
- Si hay ausencia o bloqueo, el booking publico deja de mostrar ese horario.

Duracion sugerida:

- 1 a 2 minutos

## 8. Lista de espera

Ruta:

- `/app/waitlist`

Que mostrar:

- Entradas de lista de espera
- Estado de la entrada
- Que esta separada de una reserva real

Que decir:

- Si el cliente no encuentra un horario, puede entrar a lista de espera.
- Eso no crea una reserva falsa.
- El negocio mantiene una oportunidad activa para recuperar horarios liberados.

Duracion sugerida:

- 1 minuto

## 9. Notificaciones

Ruta:

- `/app/notifications`

Que mostrar:

- Bandeja limpia
- Inbox operativo
- Drawer de detalles
- Acciones compactas
- Posibilidad de marcar reserva como falsa

Que decir:

- Las notificaciones ya no se ven como historial pesado, sino como inbox operativo.
- La bandeja limpia muestra solo pendientes y fallidas.
- El equipo puede revisar, limpiar y auditar sin borrar datos.
- Si una reserva fue falsa o no deseada, se puede cancelar desde aqui sin perder trazabilidad.

Duracion sugerida:

- 1 a 2 minutos

## 10. Reportes

Ruta:

- `/app/reports`

Que mostrar:

- Totales de reservas
- Estado de reservas
- Clientes nuevos
- Tablas por servicio o profesional

Que decir:

- El negocio ya puede medir operacion basica sin depender de herramientas externas.
- No busca ser BI avanzado todavia, pero si dar visibilidad inmediata para gestion diaria.

Duracion sugerida:

- 1 minuto

## 11. Superadmin

Ruta:

- `/superadmin`

Que mostrar:

- Lista de negocios
- Estado comercial manual
- Seguimiento basico

Que decir:

- Esta vista es interna para operar el SaaS.
- Permite ver negocios registrados y llevar control comercial sin depender todavia de cobros automaticos.
- Hoy el cobro del SaaS esta pensado como proceso manual.

Duracion sugerida:

- 1 minuto

## Qué NO mostrar todavia

No vender ni prometer como activo en demo:

- Meta Cloud API real
- WhatsApp automatico real
- Stripe
- Pagos automaticos
- Anticipos
- Email automatico real

Mensaje sugerido si preguntan:

`La base tecnica ya esta preparada para notificaciones y futuras integraciones, pero en esta etapa del MVP estamos enfocados en la operacion de reservas y en validar el producto con negocios reales.`

## Script corto sugerido por modulo

Si necesitas una version muy resumida:

- Landing: `Asi se presenta Agenda Viva hacia afuera.`
- Booking: `Aqui un cliente puede reservar sin llamar ni escribir.`
- Reserva creada: `La reserva entra pendiente y el negocio conserva control.`
- Agenda: `Esta es la vista operativa del dia.`
- Clientes: `Cada reserva alimenta la base de clientes.`
- Servicios y profesionales: `El negocio decide que ofrece y quien aparece.`
- Disponibilidad: `Los horarios se calculan con reglas reales, no mock.`
- Lista de espera: `Si no hay espacio, aun se captura la oportunidad.`
- Notificaciones: `El equipo revisa la cola como inbox operativo.`
- Reportes: `Ya hay visibilidad basica del desempeno.`
- Superadmin: `Esta es la capa interna para operar el SaaS.`

## Checklist final antes de enseñar

- La landing carga bien en `/`
- El booking demo carga en `/booking/clinica-demo`
- Hay al menos un servicio publico visible
- Hay al menos un profesional publico visible
- Hay horarios disponibles reales
- Crear una reserva publica sigue funcionando
- La reserva aparece en `/app/calendar`
- La reserva aparece en `/app/patients`
- La reserva aparece en `/app/notifications`
- La lista de espera sigue separada del booking
- `/app/notifications` muestra `Bandeja limpia`
- El drawer de detalles abre correctamente
- `/app/reports` carga
- `/superadmin` carga con el usuario demo
- No hay errores visibles de build ni pantallas rotas

## Cierre sugerido

Puedes cerrar con algo como:

`Lo importante de Agenda Viva es que ya resuelve el flujo completo de reservas: captacion, disponibilidad, agenda, seguimiento y operacion interna. Lo que sigue es profundizar integraciones y capa comercial, pero la base del producto ya esta lista para validarse con negocios reales.`
