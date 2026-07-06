export const billingStatusOptions = [
  { value: "TRIAL", label: "Prueba" },
  { value: "ACTIVE", label: "Activo" },
  { value: "PAYMENT_PENDING", label: "Pago pendiente" },
  { value: "SUSPENDED", label: "Suspendido" },
  { value: "CANCELLED", label: "Cancelado" },
] as const;

export type BillingStatusValue = (typeof billingStatusOptions)[number]["value"];

export const billingStatusValues = new Set<string>(
  billingStatusOptions.map((option) => option.value),
);

export function getBillingStatusLabel(value: string | null | undefined) {
  if (!value) {
    return "Prueba";
  }

  return (
    billingStatusOptions.find((option) => option.value === value)?.label ?? "Prueba"
  );
}
