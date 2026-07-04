export const businessTypeOptions = [
  { value: "clinic-consultorio", label: "Clinica / consultorio" },
  { value: "dental", label: "Dental" },
  { value: "psicologia", label: "Psicologia" },
  { value: "fisioterapia", label: "Fisioterapia" },
  { value: "spa-estetica", label: "Spa y estetica" },
  { value: "barberia", label: "Barberia" },
  { value: "salon-belleza", label: "Salon de belleza" },
  { value: "veterinaria", label: "Veterinaria" },
  { value: "entrenamiento-clases", label: "Entrenamiento / clases" },
  { value: "centro-deportivo", label: "Centro deportivo" },
  { value: "otro", label: "Otro" },
] as const;

export type BusinessTypeValue = (typeof businessTypeOptions)[number]["value"];

export const businessTypeValues = new Set<string>(
  businessTypeOptions.map((option) => option.value),
);

export function getBusinessTypeLabel(value: string | null | undefined) {
  if (!value) {
    return "Sin definir";
  }

  return (
    businessTypeOptions.find((option) => option.value === value)?.label ??
    "Sin definir"
  );
}
