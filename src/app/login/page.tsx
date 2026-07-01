import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { getCurrentAuthContext } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Iniciar sesión | CitaFlow",
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
    note: "Cada usuario entra solo a los negocios activos de su membresía.",
  },
  {
    label: "Auditoria",
    value: "Activa",
    note: "Registramos login exitoso, fallido y cierre de sesión.",
  },
  {
    label: "Acceso",
    value: "/app/*",
    note: "Todo el panel requiere una sesión válida antes de mostrar contenido.",
  },
];

const loginChecklist = [
  "El panel resuelve el negocio actual desde la sesión del usuario.",
  "Si la sesión expira, el acceso protegido redirige de vuelta a login.",
  "El rate limiting básico bloquea intentos repetidos por IP.",
];

export default async function LoginPage() {
  const authContext = await getCurrentAuthContext();

  if (authContext) {
    redirect("/app/dashboard");
  }

  return (
    <AuthShell
      eyebrow="Acceso seguro"
      title="Entra al panel y opera tu negocio desde una sola sesión."
      description="Inicia sesión con tu email y contraseña para administrar reservas, clientes, profesionales y servicios sin tocar la landing pública."
      asideTitle="Sesión real sobre la base multi-tenant"
      asideDescription="La autenticación ya vive sobre Prisma y PostgreSQL, con sesiones persistidas, cookies seguras y tenant resuelto desde membresías activas."
      highlights={loginHighlights}
      checklist={loginChecklist}
    >
      <LoginForm />
    </AuthShell>
  );
}
