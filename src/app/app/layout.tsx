import type { Metadata } from "next";
import type { ReactNode } from "react";

import { PanelShell } from "@/components/app/panel-shell";
import { requireAuthContext } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "CitaFlow App",
  description: "Panel protegido del SaaS multi-tenant de CitaFlow.",
};

export default async function SaaSLayout({ children }: { children: ReactNode }) {
  const authContext = await requireAuthContext();

  return <PanelShell auth={authContext}>{children}</PanelShell>;
}
