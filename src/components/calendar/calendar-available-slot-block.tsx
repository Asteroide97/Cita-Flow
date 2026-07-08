import Link from "next/link";

import { cn } from "@/lib/utils";
import type { CalendarAvailableSlotLayout } from "@/types/calendar";

import { getCalendarAvailableTone } from "./calendar-helpers";

type CalendarAvailableSlotBlockProps = {
  layout: CalendarAvailableSlotLayout;
  href: string;
  isSelected?: boolean;
};

export function CalendarAvailableSlotBlock({
  layout,
  href,
  isSelected = false,
}: CalendarAvailableSlotBlockProps) {
  const tone = getCalendarAvailableTone();

  return (
    <Link
      href={href}
      title={`Disponible a las ${layout.startLabel}`}
      className={cn(
        "absolute inset-x-4 z-[1] h-2 -translate-y-1/2 rounded-full border border-dashed transition-all duration-200",
        tone.blockClassName,
        isSelected ? "ring-2 ring-brand-200 ring-offset-1 ring-offset-white" : "",
      )}
      style={{ top: `${layout.top}px` }}
    >
      <span className="sr-only">Hueco disponible a las {layout.startLabel}</span>
    </Link>
  );
}
