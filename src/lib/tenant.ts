import { TEMPORARY_CLINIC_CONTEXT } from "./demo-tenant";

export function getCurrentClinicContext() {
  // TODO: Reemplazar este helper temporal por resolucion de tenant desde auth real.
  return TEMPORARY_CLINIC_CONTEXT;
}

export function getCurrentClinicId() {
  return getCurrentClinicContext().clinicId;
}

export function assertClinicAccess(clinicId: string) {
  const currentClinicId = getCurrentClinicId();

  if (clinicId !== currentClinicId) {
    throw new Error("Acceso cruzado entre clinics bloqueado.");
  }
}
