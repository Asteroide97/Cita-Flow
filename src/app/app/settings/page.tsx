import { PanelPage } from "@/components/app/panel-page";
import { PanelPlaceholder } from "@/components/app/panel-placeholder";
import { panelSections } from "@/data/panel";

const section = panelSections.settings;

export default function SettingsPage() {
  return (
    <PanelPage
      eyebrow="Configuracion"
      title={section.title}
      description={section.description}
    >
      <PanelPlaceholder highlights={section.highlights} />
    </PanelPage>
  );
}
