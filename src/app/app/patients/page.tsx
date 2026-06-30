import { PanelPage } from "@/components/app/panel-page";
import { PanelPlaceholder } from "@/components/app/panel-placeholder";
import { panelSections } from "@/data/panel";

const section = panelSections.patients;

export default function PatientsPage() {
  return (
    <PanelPage
      eyebrow="Pacientes"
      title={section.title}
      description={section.description}
    >
      <PanelPlaceholder highlights={section.highlights} />
    </PanelPage>
  );
}
