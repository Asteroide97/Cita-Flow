import type { Metadata } from "next";
import type { ReactNode } from "react";

import { PanelShell } from "@/components/app/panel-shell";
import { requireAuthContext } from "@/lib/auth/session";
import { brand, withBrandTitle } from "@/lib/brand";

export const metadata: Metadata = {
  title: withBrandTitle("Panel"),
  description: `Panel protegido del SaaS multi-tenant de ${brand.name}.`,
};

export default async function SaaSLayout({ children }: { children: ReactNode }) {
  const authContext = await requireAuthContext();

  return <PanelShell auth={authContext}>{children}</PanelShell>;
}
