import { PanelPage } from "@/components/app/panel-page";
import { PanelPlaceholder } from "@/components/app/panel-placeholder";
import { panelSections } from "@/data/panel";

const section = panelSections.patients;

export default function PatientsPage() {
  return (
    <PanelPage
      eyebrow="Clientes"
      title={section.title}
      description="Base de clientes registrados por reservas, WhatsApp o panel."
    >
      <PanelPlaceholder highlights={section.highlights} />
    </PanelPage>
  );
}
