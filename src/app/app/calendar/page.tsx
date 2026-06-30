import { PanelPage } from "@/components/app/panel-page";
import { PanelPlaceholder } from "@/components/app/panel-placeholder";
import { panelSections } from "@/data/panel";

const section = panelSections.calendar;

export default function CalendarPage() {
  return (
    <PanelPage
      eyebrow="Agenda"
      title={section.title}
      description={section.description}
    >
      <PanelPlaceholder highlights={section.highlights} />
    </PanelPage>
  );
}
