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
    note: "La cookie de sesion no expone credenciales ni datos sensibles.",
  },
  {
    label: "Tenant",
    value: "Aislado",
    note: "Cada usuario entra solo a los negocios activos de su membresia.",
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
  "El panel resuelve el negocio actual desde la sesion del usuario.",
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
      title="Entra al panel y opera tu negocio desde una sola sesion."
      description="Inicia sesion con tu email y contrasena para administrar reservas, clientes, profesionales y servicios sin tocar la landing publica."
      asideTitle="Sesion real sobre la base multi-tenant"
      asideDescription="La autenticacion ya vive sobre Prisma y PostgreSQL, con sesiones persistidas, cookies seguras y tenant resuelto desde membresias activas."
      highlights={loginHighlights}
      checklist={loginChecklist}
    >
      <LoginForm />
    </AuthShell>
  );
}
