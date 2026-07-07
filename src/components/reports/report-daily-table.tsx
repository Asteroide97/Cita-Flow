import type { ReportDailyRow } from "@/types/reports";

type ReportDailyTableProps = {
  rows: ReportDailyRow[];
};

function getBarWidth(value: number, maxValue: number) {
  if (!maxValue) {
    return "0%";
  }

  return `${Math.max((value / maxValue) * 100, value > 0 ? 8 : 0)}%`;
}

export function ReportDailyTable({ rows }: ReportDailyTableProps) {
  const maxTotal = rows.reduce((current, row) => Math.max(current, row.total), 0);
  const hasData = rows.some((row) => row.total > 0);

  return (
    <section className="surface-card p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">
            Reservas por dia
          </p>
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
          {rows.length} dias
        </p>
      </div>

      {hasData ? (
        <>
          <div className="mt-5 grid gap-3 sm:hidden">
            {rows.map((row) => (
              <article
                key={row.dateValue}
                className="rounded-[22px] border border-line/80 bg-white px-4 py-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-ink">{row.label}</p>
                    <div className="mt-2 h-2 rounded-full bg-slate-100">
                      <div
                        className="h-2 rounded-full bg-brand-500"
                        style={{ width: getBarWidth(row.total, maxTotal) }}
                      />
                    </div>
                  </div>
                  <span className="rounded-full border border-line/80 bg-surface-soft px-3 py-1 text-xs font-semibold text-ink">
                    {row.total}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
                      Confirmadas
                    </p>
                    <p className="mt-1 font-semibold text-emerald-700">{row.confirmed}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
                      Pendientes
                    </p>
                    <p className="mt-1 font-semibold text-amber-700">{row.pending}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
                      Canceladas
                    </p>
                    <p className="mt-1 font-semibold text-rose-700">{row.cancelled}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
                      Completadas
                    </p>
                    <p className="mt-1 font-semibold text-brand-700">{row.completed}</p>
                  </div>
                </div>

                <p className="mt-3 text-sm text-slate-700">No-show: {row.noShow}</p>
              </article>
            ))}
          </div>

          <div className="mt-5 hidden overflow-x-auto sm:block">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-line/80 text-left text-xs uppercase tracking-[0.16em] text-muted">
                <th className="pb-3 font-semibold">Dia</th>
                <th className="pb-3 font-semibold">Total</th>
                <th className="pb-3 font-semibold">Confirmadas</th>
                <th className="pb-3 font-semibold">Pendientes</th>
                <th className="pb-3 font-semibold">Canceladas</th>
                <th className="pb-3 font-semibold">Completadas</th>
                <th className="pb-3 font-semibold">No-show</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.dateValue} className="border-b border-line/60 last:border-b-0">
                  <td className="py-3 pr-4">
                    <div>
                      <p className="font-semibold text-ink">{row.label}</p>
                      <div className="mt-2 h-2 rounded-full bg-slate-100">
                        <div
                          className="h-2 rounded-full bg-brand-500"
                          style={{ width: getBarWidth(row.total, maxTotal) }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-3 pr-4 font-semibold text-ink">{row.total}</td>
                  <td className="py-3 pr-4 text-emerald-700">{row.confirmed}</td>
                  <td className="py-3 pr-4 text-amber-700">{row.pending}</td>
                  <td className="py-3 pr-4 text-rose-700">{row.cancelled}</td>
                  <td className="py-3 pr-4 text-brand-700">{row.completed}</td>
                  <td className="py-3 text-slate-700">{row.noShow}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </>
      ) : (
        <div className="mt-5 rounded-[24px] border border-dashed border-line bg-surface-soft px-5 py-4 text-sm text-muted">
          No hay reservas en este rango.
        </div>
      )}
    </section>
  );
}
