import type { Metadata } from "next";

import { DemoChecklistBoard } from "@/components/app/demo-checklist-board";
import { PanelPage } from "@/components/app/panel-page";
import { demoChecklistGroups } from "@/data/demo-checklist";
import { withBrandTitle } from "@/lib/brand";

export const metadata: Metadata = {
  title: withBrandTitle("QA"),
  description: "Checklist interno para revisar la demo del producto.",
};

export default function DemoChecklistPage() {
  return (
    <PanelPage
      eyebrow="QA"
      title="Checklist de demo"
      description="Revision interna para validar que Agenda Viva esta lista para mostrarse."
    >
      <DemoChecklistBoard groups={demoChecklistGroups} />
    </PanelPage>
  );
}
