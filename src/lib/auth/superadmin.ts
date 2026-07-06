import { redirect } from "next/navigation";

import { requireAuthContext } from "@/lib/auth/session";

const SUPERADMIN_EMAILS = new Set(["demo@citaflow.app"]);

export function isSuperAdminEmail(email: string) {
  return SUPERADMIN_EMAILS.has(email.trim().toLowerCase());
}

export async function requireSuperAdminContext() {
  const authContext = await requireAuthContext();

  // TODO: reemplazar esta regla temporal por un rol SUPERADMIN real.
  if (!isSuperAdminEmail(authContext.user.email)) {
    redirect("/app/dashboard");
  }

  return authContext;
}
