export const DEMO_CLINIC_ID = "clinic_demo";
export const DEMO_CLINIC_SLUG = "clinica-demo";
export const DEMO_CLINIC_NAME = "Clinica Demo";
export const DEMO_TIMEZONE = "America/Mexico_City";

export type TemporaryClinicContext = {
  clinicId: string;
  clinicSlug: string;
  clinicName: string;
  timezone: string;
};

export const TEMPORARY_CLINIC_CONTEXT: TemporaryClinicContext = {
  clinicId: DEMO_CLINIC_ID,
  clinicSlug: DEMO_CLINIC_SLUG,
  clinicName: DEMO_CLINIC_NAME,
  timezone: DEMO_TIMEZONE,
};
