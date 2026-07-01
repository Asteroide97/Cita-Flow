"use client";

import { useFormStatus } from "react-dom";

export function WaitlistSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
      style={{ backgroundColor: "var(--booking-brand)" }}
    >
      {pending ? "Guardando..." : "Unirme a la lista de espera"}
    </button>
  );
}
