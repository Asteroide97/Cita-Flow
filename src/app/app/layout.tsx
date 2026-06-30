import type { Metadata } from "next";
import type { ReactNode } from "react";

import { PanelShell } from "@/components/app/panel-shell";
import { getCurrentClinicContext } from "@/lib/tenant";

export const metadata: Metadata = {
  title: "CitaFlow App",
  description: "Base inicial del panel SaaS multi-tenant de CitaFlow.",
};

export default function SaaSLayout({ children }: { children: ReactNode }) {
  const clinic = getCurrentClinicContext();

  return <PanelShell clinic={clinic}>{children}</PanelShell>;
}
