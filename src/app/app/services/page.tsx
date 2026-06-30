import { PanelPage } from "@/components/app/panel-page";
import { PanelPlaceholder } from "@/components/app/panel-placeholder";
import { panelSections } from "@/data/panel";

const section = panelSections.services;

export default function ServicesPage() {
  return (
    <PanelPage
      eyebrow="Servicios"
      title={section.title}
      description={section.description}
    >
      <PanelPlaceholder highlights={section.highlights} />
    </PanelPage>
  );
}
