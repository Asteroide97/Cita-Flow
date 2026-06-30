type CalendarEmptyStateProps = {
  title?: string;
  description?: string;
};

export function CalendarEmptyState({
  title = "No hay citas programadas",
  description = "Cambia la fecha o el filtro de doctor para revisar otro tramo de agenda.",
}: CalendarEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[26px] border border-dashed border-line/90 bg-surface-soft px-6 py-14 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-soft">
        <div className="grid h-5 w-5 grid-cols-2 gap-1">
          <span className="rounded-full bg-brand-600" />
          <span className="rounded-full bg-brand-200" />
          <span className="rounded-full bg-brand-200" />
          <span className="rounded-full bg-brand-600" />
        </div>
      </div>

      <h3 className="mt-5 text-xl font-semibold tracking-[-0.04em] text-ink">
        {title}
      </h3>
      <p className="mt-3 max-w-lg text-sm leading-7 text-muted">{description}</p>
    </div>
  );
}
