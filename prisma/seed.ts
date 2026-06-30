import { AppointmentSource, AppointmentStatus, PrismaClient, Role } from "@prisma/client";

import {
  DEMO_CLINIC_ID,
  DEMO_CLINIC_NAME,
  DEMO_CLINIC_SLUG,
  DEMO_TIMEZONE,
} from "../src/lib/demo-tenant";
import { hashPassword } from "../src/lib/security/password";

const prisma = new PrismaClient();

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
      legalName: "CitaFlow Clinica Demo S.A. de C.V.",
      timezone: DEMO_TIMEZONE,
      currency: "MXN",
      brandColor: "#2563eb",
      isActive: true,
    },
    create: {
      id: DEMO_CLINIC_ID,
      name: DEMO_CLINIC_NAME,
      slug: DEMO_CLINIC_SLUG,
      legalName: "CitaFlow Clinica Demo S.A. de C.V.",
      timezone: DEMO_TIMEZONE,
      currency: "MXN",
      brandColor: "#2563eb",
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
      name: "Dra. Sofia Herrera",
      specialty: "Medicina general",
      bio: "Atencion primaria, seguimiento y consulta diaria.",
      isActive: true,
    },
    create: {
      id: DEMO_DOCTOR_1_ID,
      clinicId: DEMO_CLINIC_ID,
      name: "Dra. Sofia Herrera",
      specialty: "Medicina general",
      bio: "Atencion primaria, seguimiento y consulta diaria.",
      isActive: true,
    },
  });

  await prisma.doctor.upsert({
    where: { id: DEMO_DOCTOR_2_ID },
    update: {
      clinicId: DEMO_CLINIC_ID,
      name: "Dr. Diego Campos",
      specialty: "Cardiologia",
      bio: "Valoracion inicial, revisiones y seguimiento clinico.",
      isActive: true,
    },
    create: {
      id: DEMO_DOCTOR_2_ID,
      clinicId: DEMO_CLINIC_ID,
      name: "Dr. Diego Campos",
      specialty: "Cardiologia",
      bio: "Valoracion inicial, revisiones y seguimiento clinico.",
      isActive: true,
    },
  });

  await prisma.service.upsert({
    where: { id: DEMO_SERVICE_1_ID },
    update: {
      clinicId: DEMO_CLINIC_ID,
      name: "Primera consulta",
      description: "Valoracion general para nuevos pacientes.",
      durationMinutes: 45,
      priceCents: 85000,
      depositRequired: true,
      depositCents: 20000,
      isActive: true,
    },
    create: {
      id: DEMO_SERVICE_1_ID,
      clinicId: DEMO_CLINIC_ID,
      name: "Primera consulta",
      description: "Valoracion general para nuevos pacientes.",
      durationMinutes: 45,
      priceCents: 85000,
      depositRequired: true,
      depositCents: 20000,
      isActive: true,
    },
  });

  await prisma.service.upsert({
    where: { id: DEMO_SERVICE_2_ID },
    update: {
      clinicId: DEMO_CLINIC_ID,
      name: "Consulta de seguimiento",
      description: "Revision de evolucion y ajustes de tratamiento.",
      durationMinutes: 30,
      priceCents: 65000,
      depositRequired: false,
      depositCents: null,
      isActive: true,
    },
    create: {
      id: DEMO_SERVICE_2_ID,
      clinicId: DEMO_CLINIC_ID,
      name: "Consulta de seguimiento",
      description: "Revision de evolucion y ajustes de tratamiento.",
      durationMinutes: 30,
      priceCents: 65000,
      depositRequired: false,
      depositCents: null,
      isActive: true,
    },
  });

  await prisma.service.upsert({
    where: { id: DEMO_SERVICE_3_ID },
    update: {
      clinicId: DEMO_CLINIC_ID,
      name: "Chequeo preventivo",
      description: "Consulta breve para control preventivo.",
      durationMinutes: 20,
      priceCents: 50000,
      depositRequired: false,
      depositCents: null,
      isActive: true,
    },
    create: {
      id: DEMO_SERVICE_3_ID,
      clinicId: DEMO_CLINIC_ID,
      name: "Chequeo preventivo",
      description: "Consulta breve para control preventivo.",
      durationMinutes: 20,
      priceCents: 50000,
      depositRequired: false,
      depositCents: null,
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
      notes: "Paciente con seguimiento mensual.",
    },
    create: {
      id: DEMO_PATIENT_1_ID,
      clinicId: DEMO_CLINIC_ID,
      name: "Ana Lopez",
      phoneE164: "+525511111111",
      email: "ana.lopez@example.com",
      notes: "Paciente con seguimiento mensual.",
    },
  });

  await prisma.patient.upsert({
    where: { id: DEMO_PATIENT_2_ID },
    update: {
      clinicId: DEMO_CLINIC_ID,
      name: "Carlos Mendez",
      phoneE164: "+525522222222",
      email: "carlos.mendez@example.com",
      notes: "Primera visita referida por familiar.",
    },
    create: {
      id: DEMO_PATIENT_2_ID,
      clinicId: DEMO_CLINIC_ID,
      name: "Carlos Mendez",
      phoneE164: "+525522222222",
      email: "carlos.mendez@example.com",
      notes: "Primera visita referida por familiar.",
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
      notes: "Cita confirmada por recepcion.",
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
      notes: "Cita confirmada por recepcion.",
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
