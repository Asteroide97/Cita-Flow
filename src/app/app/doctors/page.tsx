import { PanelPage } from "@/components/app/panel-page";
import { PanelPlaceholder } from "@/components/app/panel-placeholder";
import { panelSections } from "@/data/panel";

const section = panelSections.doctors;

export default function DoctorsPage() {
  return (
    <PanelPage
      eyebrow="Doctores"
      title={section.title}
      description={section.description}
    >
      <PanelPlaceholder highlights={section.highlights} />
    </PanelPage>
  );
}
