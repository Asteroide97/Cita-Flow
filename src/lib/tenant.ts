import { requireAuthContext } from "./auth/session";

export type CurrentClinicContext = {
  clinicId: string;
  clinicSlug: string;
  clinicName: string;
  timezone: string;
  currency: string;
  brandColor: string | null;
};

export async function getCurrentClinicContext(): Promise<CurrentClinicContext> {
  const authContext = await requireAuthContext();

  // Si el usuario pertenece a varias clinicas, por ahora tomamos la primera activa
  // resuelta por la sesion. Luego se conectara a un selector explicito de clinic.
  return {
    clinicId: authContext.clinic.id,
    clinicSlug: authContext.clinic.slug,
    clinicName: authContext.clinic.name,
    timezone: authContext.clinic.timezone,
    currency: authContext.clinic.currency,
    brandColor: authContext.clinic.brandColor,
  };
}

export async function getCurrentClinicId() {
  const clinic = await getCurrentClinicContext();

  return clinic.clinicId;
}

export async function assertClinicAccess(clinicId: string) {
  const currentClinicId = await getCurrentClinicId();

  if (clinicId !== currentClinicId) {
    throw new Error("Acceso cruzado entre clinics bloqueado.");
  }
}
