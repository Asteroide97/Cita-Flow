import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { getCurrentAuthContext } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Iniciar sesion | CitaFlow",
  description: "Acceso al panel SaaS de CitaFlow.",
};

const loginHighlights = [
  {
    label: "Proteccion",
    value: "httpOnly",
    note: "La cookie de sesion no expone credenciales ni datos sensibles.",
  },
  {
    label: "Tenant",
    value: "Aislado",
    note: "Cada usuario entra solo a las clinicas activas de su membresia.",
  },
  {
    label: "Auditoria",
    value: "Activa",
    note: "Registramos login exitoso, fallido y cierre de sesion.",
  },
  {
    label: "Acceso",
    value: "/app/*",
    note: "Todo el panel requiere una sesion valida antes de mostrar contenido.",
  },
];

const loginChecklist = [
  "El panel resuelve la clinica actual desde la sesion del usuario.",
  "Si la sesion expira, el acceso protegido redirige de vuelta a login.",
  "El rate limiting basico bloquea intentos repetidos por IP.",
];

export default async function LoginPage() {
  const authContext = await getCurrentAuthContext();

  if (authContext) {
    redirect("/app/dashboard");
  }

  return (
    <AuthShell
      eyebrow="Acceso seguro"
      title="Entra al panel y opera tu consultorio desde una sola sesion."
      description="Inicia sesion con tu email y contrasena para administrar citas, pacientes, doctores y servicios sin tocar la landing publica."
      asideTitle="Sesion real sobre la base multi-tenant"
      asideDescription="La autenticacion ya vive sobre Prisma y PostgreSQL, con sesiones persistidas, cookies seguras y tenant resuelto desde membresias activas."
      highlights={loginHighlights}
      checklist={loginChecklist}
    >
      <LoginForm />
    </AuthShell>
  );
}
