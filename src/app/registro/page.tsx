import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";
import { getCurrentAuthContext } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Registro inicial | Agenda Viva",
  description: "Crea tu cuenta owner y tu negocio en Agenda Viva.",
};

const registerHighlights = [
  {
    label: "Alta inicial",
    value: "3 registros",
    note: "El formulario crea User, Clinic y ClinicMember con rol OWNER.",
  },
  {
    label: "Password",
    value: "Hash",
    note: "La contrasena nunca se guarda en texto plano dentro de la base.",
  },
  {
    label: "Negocio",
    value: "Slug unico",
    note: "Validamos disponibilidad del slug antes de crear el negocio.",
  },
  {
    label: "Entrada",
    value: "Automatica",
    note: "Al terminar, se abre una sesion valida y se entra directo al panel.",
  },
];

const registerChecklist = [
  "El owner queda vinculado a su negocio desde la primera sesion.",
  "La cookie solo guarda un token aleatorio y la base persiste su hash.",
  "La estructura queda lista para selector de cuenta y permisos mas finos.",
];

export default async function RegisterPage() {
  const authContext = await getCurrentAuthContext();

  if (authContext) {
    redirect("/app/dashboard");
  }

  return (
    <AuthShell
      eyebrow="Registro inicial"
      title="Crea tu cuenta owner y deja listo el panel base de tu negocio."
      description="Este registro inicial activa el primer negocio dentro de Agenda Viva y te da acceso inmediato al panel protegido para seguir creciendo el SaaS."
      asideTitle="Onboarding base sin romper la landing"
      asideDescription="El alta crea la estructura minima del tenant, mantiene la UI en espanol y deja el proyecto listo para evolucionar a permisos, billing y flujos operativos reales."
      highlights={registerHighlights}
      checklist={registerChecklist}
    >
      <RegisterForm />
    </AuthShell>
  );
}
