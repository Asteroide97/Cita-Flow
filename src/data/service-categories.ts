export const serviceCategoryOptions = [
  { value: "general", label: "General" },
  { value: "belleza", label: "Belleza" },
  { value: "salud", label: "Salud" },
  { value: "bienestar", label: "Bienestar" },
  { value: "deporte", label: "Deporte" },
  { value: "mascotas", label: "Mascotas" },
  { value: "clases", label: "Clases" },
  { value: "otro", label: "Otro" },
] as const;

export type ServiceCategoryValue =
  (typeof serviceCategoryOptions)[number]["value"];

export const serviceCategoryValues = new Set<string>(
  serviceCategoryOptions.map((option) => option.value),
);

export function getServiceCategoryLabel(value: string | null | undefined) {
  if (!value) {
    return "Sin categoria";
  }

  return (
    serviceCategoryOptions.find((option) => option.value === value)?.label ??
    "Sin categoria"
  );
}
