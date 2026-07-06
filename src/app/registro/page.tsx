import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";
import { brand, withBrandTitle } from "@/lib/brand";
import { getCurrentAuthContext } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: withBrandTitle("Registro inicial"),
  description: `Crea tu cuenta owner y tu negocio en ${brand.name}.`,
};

const registerHighlights = [
  {
    label: "Alta inicial",
    value: "3 registros",
    note: "Crea user, clinic y membership OWNER.",
  },
  {
    label: "Password",
    value: "Hash",
    note: "La contraseña no se guarda en texto plano.",
  },
  {
    label: "Negocio",
    value: "Slug unico",
    note: "Validamos disponibilidad antes de crear.",
  },
  {
    label: "Entrada",
    value: "Automatica",
    note: "Se abre una sesión válida al terminar.",
  },
];

const registerChecklist = [
  "El owner queda vinculado al negocio desde el inicio.",
  "La cookie guarda solo un token aleatorio.",
  "La base queda lista para permisos y múltiples cuentas.",
];

export default async function RegisterPage() {
  const authContext = await getCurrentAuthContext();

  if (authContext) {
    redirect("/app/dashboard");
  }

  return (
    <AuthShell
      eyebrow="Registro inicial"
      title="Crea tu cuenta y deja listo tu negocio."
      description={`Este registro crea tu primer negocio en ${brand.name} y te da acceso inmediato al panel.`}
      asideTitle="Alta inicial"
      asideDescription="Se crean la cuenta owner, el negocio y la membresía base para empezar a configurar reservas."
      highlights={registerHighlights}
      checklist={registerChecklist}
    >
      <RegisterForm />
    </AuthShell>
  );
}
