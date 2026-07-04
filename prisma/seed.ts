import { PrismaPg } from "@prisma/adapter-pg";
import {
  AppointmentSource,
  AppointmentStatus,
  PrismaClient,
  Role,
  Weekday,
} from "@prisma/client";

import {
  DEMO_CLINIC_ID,
  DEMO_CLINIC_NAME,
  DEMO_CLINIC_SLUG,
  DEMO_TIMEZONE,
} from "../src/lib/demo-tenant";
import { brand } from "../src/lib/brand";
import { hashPassword } from "../src/lib/security/password";

function getDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL?.trim();

  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL no esta configurada. Define la conexion PostgreSQL antes de ejecutar el seed.",
    );
  }

  return databaseUrl;
}

const adapter = new PrismaPg({
  connectionString: getDatabaseUrl(),
});

const prisma = new PrismaClient({
  adapter,
});

const DEMO_USER_ID = "user_demo_owner";
const DEMO_USER_EMAIL = "demo@citaflow.app";
const DEMO_USER_PASSWORD = "Demo123456";
const DEMO_CLINIC_MEMBER_ID = "clinic_member_demo_owner";
const DEMO_DOCTOR_1_ID = "doctor_demo_1";
const DEMO_DOCTOR_2_ID = "doctor_demo_2";
const DEMO_SERVICE_1_ID = "service_demo_1";
const DEMO_SERVICE_2_ID = "service_demo_2";
const DEMO_SERVICE_3_ID = "service_demo_3";
const DEMO_PATIENT_1_ID = "patient_demo_1";
const DEMO_PATIENT_2_ID = "patient_demo_2";
const DEMO_APPOINTMENT_1_ID = "appointment_demo_1";
const DEMO_APPOINTMENT_2_ID = "appointment_demo_2";

async function main() {
  const passwordHash = await hashPassword(DEMO_USER_PASSWORD);

  await prisma.user.upsert({
    where: { id: DEMO_USER_ID },
    update: {
      name: "Usuario Demo",
      email: DEMO_USER_EMAIL,
      passwordHash,
      phoneE164: "+525500000001",
      isActive: true,
    },
    create: {
      id: DEMO_USER_ID,
      name: "Usuario Demo",
      email: DEMO_USER_EMAIL,
      passwordHash,
      phoneE164: "+525500000001",
      isActive: true,
    },
  });

  await prisma.clinic.upsert({
    where: { id: DEMO_CLINIC_ID },
    update: {
      name: DEMO_CLINIC_NAME,
      slug: DEMO_CLINIC_SLUG,
      legalName: brand.demo.legalName,
      timezone: DEMO_TIMEZONE,
      currency: "MXN",
      brandColor: "#2563eb",
      businessType: "clinic-consultorio",
      publicName: "Negocio Demo",
      publicDescription:
        "Reservas online para servicios, atencion especializada y horarios por profesional.",
      websiteUrl: brand.demo.websiteUrl,
      contactEmail: brand.demo.contactEmail,
      contactPhone: "+525500000010",
      isActive: true,
    },
    create: {
      id: DEMO_CLINIC_ID,
      name: DEMO_CLINIC_NAME,
      slug: DEMO_CLINIC_SLUG,
      legalName: brand.demo.legalName,
      timezone: DEMO_TIMEZONE,
      currency: "MXN",
      brandColor: "#2563eb",
      businessType: "clinic-consultorio",
      publicName: "Negocio Demo",
      publicDescription:
        "Reservas online para servicios, atencion especializada y horarios por profesional.",
      websiteUrl: brand.demo.websiteUrl,
      contactEmail: brand.demo.contactEmail,
      contactPhone: "+525500000010",
      isActive: true,
    },
  });

  await prisma.clinicMember.upsert({
    where: { id: DEMO_CLINIC_MEMBER_ID },
    update: {
      userId: DEMO_USER_ID,
      clinicId: DEMO_CLINIC_ID,
      role: Role.OWNER,
      isActive: true,
    },
    create: {
      id: DEMO_CLINIC_MEMBER_ID,
      userId: DEMO_USER_ID,
      clinicId: DEMO_CLINIC_ID,
      role: Role.OWNER,
      isActive: true,
    },
  });

  await prisma.doctor.upsert({
    where: { id: DEMO_DOCTOR_1_ID },
    update: {
      clinicId: DEMO_CLINIC_ID,
      name: "Sofia Herrera",
      specialty: "Atencion general",
      bio: "Atencion inicial, seguimiento y agenda diaria de servicios.",
      publicOrder: 0,
      isPublic: true,
      isActive: true,
    },
    create: {
      id: DEMO_DOCTOR_1_ID,
      clinicId: DEMO_CLINIC_ID,
      name: "Sofia Herrera",
      specialty: "Atencion general",
      bio: "Atencion inicial, seguimiento y agenda diaria de servicios.",
      publicOrder: 0,
      isPublic: true,
      isActive: true,
    },
  });

  await prisma.doctor.upsert({
    where: { id: DEMO_DOCTOR_2_ID },
    update: {
      clinicId: DEMO_CLINIC_ID,
      name: "Diego Campos",
      specialty: "Servicio especializado",
      bio: "Reservas de valoracion, revisiones y atencion especializada.",
      publicOrder: 1,
      isPublic: true,
      isActive: true,
    },
    create: {
      id: DEMO_DOCTOR_2_ID,
      clinicId: DEMO_CLINIC_ID,
      name: "Diego Campos",
      specialty: "Servicio especializado",
      bio: "Reservas de valoracion, revisiones y atencion especializada.",
      publicOrder: 1,
      isPublic: true,
      isActive: true,
    },
  });

  const weeklyAvailability = [
    { dayOfWeek: Weekday.MONDAY, startTime: "09:00", endTime: "14:00" },
    { dayOfWeek: Weekday.MONDAY, startTime: "16:00", endTime: "19:00" },
    { dayOfWeek: Weekday.TUESDAY, startTime: "09:00", endTime: "14:00" },
    { dayOfWeek: Weekday.TUESDAY, startTime: "16:00", endTime: "19:00" },
    { dayOfWeek: Weekday.WEDNESDAY, startTime: "09:00", endTime: "14:00" },
    { dayOfWeek: Weekday.WEDNESDAY, startTime: "16:00", endTime: "19:00" },
    { dayOfWeek: Weekday.THURSDAY, startTime: "09:00", endTime: "14:00" },
    { dayOfWeek: Weekday.THURSDAY, startTime: "16:00", endTime: "19:00" },
    { dayOfWeek: Weekday.FRIDAY, startTime: "09:00", endTime: "14:00" },
    { dayOfWeek: Weekday.FRIDAY, startTime: "16:00", endTime: "19:00" },
    { dayOfWeek: Weekday.SATURDAY, startTime: "09:00", endTime: "13:00" },
  ];

  for (const doctorId of [DEMO_DOCTOR_1_ID, DEMO_DOCTOR_2_ID]) {
    for (const block of weeklyAvailability) {
      await prisma.doctorAvailability.upsert({
        where: {
          doctorId_dayOfWeek_startTime_endTime: {
            doctorId,
            dayOfWeek: block.dayOfWeek,
            startTime: block.startTime,
            endTime: block.endTime,
          },
        },
        update: {
          clinicId: DEMO_CLINIC_ID,
          isActive: true,
        },
        create: {
          clinicId: DEMO_CLINIC_ID,
          doctorId,
          dayOfWeek: block.dayOfWeek,
          startTime: block.startTime,
          endTime: block.endTime,
          isActive: true,
        },
      });
    }
  }

  await prisma.service.upsert({
    where: { id: DEMO_SERVICE_1_ID },
    update: {
      clinicId: DEMO_CLINIC_ID,
      name: "Servicio completo",
      category: "salud",
      description: "Atencion inicial para nuevos clientes o casos completos.",
      durationMinutes: 45,
      priceCents: 85000,
      depositRequired: true,
      depositCents: 20000,
      publicOrder: 0,
      isPublic: true,
      isActive: true,
    },
    create: {
      id: DEMO_SERVICE_1_ID,
      clinicId: DEMO_CLINIC_ID,
      name: "Servicio completo",
      category: "salud",
      description: "Atencion inicial para nuevos clientes o casos completos.",
      durationMinutes: 45,
      priceCents: 85000,
      depositRequired: true,
      depositCents: 20000,
      publicOrder: 0,
      isPublic: true,
      isActive: true,
    },
  });

  await prisma.service.upsert({
    where: { id: DEMO_SERVICE_2_ID },
    update: {
      clinicId: DEMO_CLINIC_ID,
      name: "Servicio de seguimiento",
      category: "bienestar",
      description: "Revision de avance, continuidad y ajustes del servicio.",
      durationMinutes: 30,
      priceCents: 65000,
      depositRequired: false,
      depositCents: null,
      publicOrder: 1,
      isPublic: true,
      isActive: true,
    },
    create: {
      id: DEMO_SERVICE_2_ID,
      clinicId: DEMO_CLINIC_ID,
      name: "Servicio de seguimiento",
      category: "bienestar",
      description: "Revision de avance, continuidad y ajustes del servicio.",
      durationMinutes: 30,
      priceCents: 65000,
      depositRequired: false,
      depositCents: null,
      publicOrder: 1,
      isPublic: true,
      isActive: true,
    },
  });

  await prisma.service.upsert({
    where: { id: DEMO_SERVICE_3_ID },
    update: {
      clinicId: DEMO_CLINIC_ID,
      name: "Servicio express",
      category: "general",
      description: "Reserva breve para atencion rapida y control puntual.",
      durationMinutes: 30,
      priceCents: 50000,
      depositRequired: false,
      depositCents: null,
      publicOrder: 2,
      isPublic: true,
      isActive: true,
    },
    create: {
      id: DEMO_SERVICE_3_ID,
      clinicId: DEMO_CLINIC_ID,
      name: "Servicio express",
      category: "general",
      description: "Reserva breve para atencion rapida y control puntual.",
      durationMinutes: 30,
      priceCents: 50000,
      depositRequired: false,
      depositCents: null,
      publicOrder: 2,
      isPublic: true,
      isActive: true,
    },
  });

  await prisma.patient.upsert({
    where: { id: DEMO_PATIENT_1_ID },
    update: {
      clinicId: DEMO_CLINIC_ID,
      name: "Ana Lopez",
      phoneE164: "+525511111111",
      email: "ana.lopez@example.com",
      notes: "Cliente frecuente con visitas mensuales.",
    },
    create: {
      id: DEMO_PATIENT_1_ID,
      clinicId: DEMO_CLINIC_ID,
      name: "Ana Lopez",
      phoneE164: "+525511111111",
      email: "ana.lopez@example.com",
      notes: "Cliente frecuente con visitas mensuales.",
    },
  });

  await prisma.patient.upsert({
    where: { id: DEMO_PATIENT_2_ID },
    update: {
      clinicId: DEMO_CLINIC_ID,
      name: "Carlos Mendez",
      phoneE164: "+525522222222",
      email: "carlos.mendez@example.com",
      notes: "Primera reserva referida por un contacto.",
    },
    create: {
      id: DEMO_PATIENT_2_ID,
      clinicId: DEMO_CLINIC_ID,
      name: "Carlos Mendez",
      phoneE164: "+525522222222",
      email: "carlos.mendez@example.com",
      notes: "Primera reserva referida por un contacto.",
    },
  });

  await prisma.appointment.upsert({
    where: { id: DEMO_APPOINTMENT_1_ID },
    update: {
      clinicId: DEMO_CLINIC_ID,
      doctorId: DEMO_DOCTOR_1_ID,
      serviceId: DEMO_SERVICE_1_ID,
      patientId: DEMO_PATIENT_2_ID,
      startAt: new Date("2026-07-18T16:30:00.000Z"),
      endAt: new Date("2026-07-18T17:15:00.000Z"),
      status: AppointmentStatus.CONFIRMED,
      source: AppointmentSource.ADMIN,
      notes: "Reserva confirmada desde el panel.",
    },
    create: {
      id: DEMO_APPOINTMENT_1_ID,
      clinicId: DEMO_CLINIC_ID,
      doctorId: DEMO_DOCTOR_1_ID,
      serviceId: DEMO_SERVICE_1_ID,
      patientId: DEMO_PATIENT_2_ID,
      startAt: new Date("2026-07-18T16:30:00.000Z"),
      endAt: new Date("2026-07-18T17:15:00.000Z"),
      status: AppointmentStatus.CONFIRMED,
      source: AppointmentSource.ADMIN,
      notes: "Reserva confirmada desde el panel.",
    },
  });

  await prisma.appointment.upsert({
    where: { id: DEMO_APPOINTMENT_2_ID },
    update: {
      clinicId: DEMO_CLINIC_ID,
      doctorId: DEMO_DOCTOR_2_ID,
      serviceId: DEMO_SERVICE_2_ID,
      patientId: DEMO_PATIENT_1_ID,
      startAt: new Date("2026-07-18T18:00:00.000Z"),
      endAt: new Date("2026-07-18T18:30:00.000Z"),
      status: AppointmentStatus.PENDING,
      source: AppointmentSource.WHATSAPP,
      notes: "Pendiente de confirmacion por mensaje.",
    },
    create: {
      id: DEMO_APPOINTMENT_2_ID,
      clinicId: DEMO_CLINIC_ID,
      doctorId: DEMO_DOCTOR_2_ID,
      serviceId: DEMO_SERVICE_2_ID,
      patientId: DEMO_PATIENT_1_ID,
      startAt: new Date("2026-07-18T18:00:00.000Z"),
      endAt: new Date("2026-07-18T18:30:00.000Z"),
      status: AppointmentStatus.PENDING,
      source: AppointmentSource.WHATSAPP,
      notes: "Pendiente de confirmacion por mensaje.",
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
