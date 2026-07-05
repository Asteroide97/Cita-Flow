import type { CalendarBlockedLayout, CalendarBlockedTime } from "@/types/calendar";

import {
  formatCalendarTimeRange,
  getCalendarBlockedTone,
} from "./calendar-helpers";

type CalendarBlockedTimeBlockProps = {
  blockedTime: CalendarBlockedTime;
  timezone: string;
  variant: "day" | "week" | "list";
  layout?: CalendarBlockedLayout;
};

export function CalendarBlockedTimeBlock({
  blockedTime,
  timezone,
  variant,
  layout,
}: CalendarBlockedTimeBlockProps) {
  const tone = getCalendarBlockedTone();

  if (variant === "list") {
    return (
      <div
        className={`rounded-[22px] border px-4 py-4 ${tone.blockClassName}`}
        aria-label="Horario bloqueado"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em]">
              Bloqueado
            </p>
            <p className="mt-2 text-sm font-medium">
              {formatCalendarTimeRange(blockedTime.startAt, blockedTime.endAt, timezone)}
            </p>
          </div>

          <span
            className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${tone.badgeClassName}`}
          >
            Bloqueado
          </span>
        </div>

        {blockedTime.reason ? (
          <p className="mt-3 text-sm opacity-85">{blockedTime.reason}</p>
        ) : null}
      </div>
    );
  }

  if (!layout) {
    return null;
  }

  return (
    <div
      className={`pointer-events-none absolute inset-x-1 rounded-[20px] border px-3 py-2 ${tone.blockClassName} z-0`}
      style={{
        top: `${layout.top}px`,
        height: `${layout.height}px`,
      }}
      aria-hidden="true"
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] opacity-85">
        Bloqueado · {layout.startLabel} - {layout.endLabel}
      </p>
      {layout.height >= 64 ? (
        <p className="mt-2 truncate text-xs font-medium opacity-80">
          {blockedTime.reason ?? "Sin motivo"}
        </p>
      ) : null}
    </div>
  );
}
