import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { brand, withBrandTitle } from "@/lib/brand";
import { getCurrentAuthContext } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: withBrandTitle("Iniciar sesion"),
  description: `Acceso al panel SaaS de ${brand.name}.`,
};

const loginHighlights = [
  {
    label: "Proteccion",
    value: "httpOnly",
    note: "La cookie no expone datos sensibles.",
  },
  {
    label: "Cuentas",
    value: "Aisladas",
    note: "Cada usuario entra solo a sus negocios activos.",
  },
  {
    label: "Auditoria",
    value: "Activa",
    note: "Guardamos login, error y cierre de sesión.",
  },
  {
    label: "Acceso",
    value: "/app/*",
    note: "Todo el panel requiere una sesión válida.",
  },
];

const loginChecklist = [
  "El negocio actual se resuelve desde la sesión.",
  "Si la sesión expira, el panel vuelve a login.",
  "El rate limiting basico bloquea intentos repetidos.",
];

export default async function LoginPage() {
  const authContext = await getCurrentAuthContext();

  if (authContext) {
    redirect("/app/dashboard");
  }

  return (
    <AuthShell
      eyebrow="Acceso seguro"
      title="Entra al panel y opera tu negocio."
      description="Inicia sesión con tu email y contraseña para administrar reservas, clientes, profesionales y servicios."
      asideTitle="Acceso protegido"
      asideDescription="Sesiones seguras, cuentas aisladas y auditoría básica lista desde el primer acceso."
      highlights={loginHighlights}
      checklist={loginChecklist}
    >
      <LoginForm />
    </AuthShell>
  );
}
