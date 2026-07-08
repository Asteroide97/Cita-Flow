type CalendarLinkActionsProps = {
  calendarIcsUrl?: string | null;
  googleCalendarUrl?: string | null;
  className?: string;
};

export function CalendarLinkActions({
  calendarIcsUrl,
  googleCalendarUrl,
  className,
}: CalendarLinkActionsProps) {
  if (!calendarIcsUrl && !googleCalendarUrl) {
    return null;
  }

  return (
    <div className={className ?? "flex flex-wrap gap-3"}>
      {calendarIcsUrl ? (
        <a
          href={calendarIcsUrl}
          className="inline-flex items-center justify-center rounded-full border border-line/80 bg-white px-5 py-3 text-sm font-semibold text-ink transition-colors hover:border-brand-200 hover:bg-brand-50"
        >
          Agregar a calendario
        </a>
      ) : null}

      {googleCalendarUrl ? (
        <a
          href={googleCalendarUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center rounded-full border border-brand-200 bg-brand-50 px-5 py-3 text-sm font-semibold text-brand-700 transition-colors hover:border-brand-300 hover:bg-brand-100"
        >
          Abrir en Google Calendar
        </a>
      ) : null}
    </div>
  );
}
