import Link from "next/link";
import { AppointmentStatus } from "@prisma/client";

import { formatDateTimeInTimeZone } from "@/lib/appointments/availability";
import type { ReportRankingRow } from "@/types/reports";

type ReportRankingTableProps = {
  eyebrow: string;
  title: string;
  emptyMessage: string;
  rows: ReportRankingRow[];
  timezone: string;
};

function getBarWidth(value: number, maxValue: number) {
  if (!maxValue) {
    return "0%";
  }

  return `${Math.max((value / maxValue) * 100, value > 0 ? 10 : 0)}%`;
}

function getStatusValue(row: ReportRankingRow, status: AppointmentStatus) {
  return row.statusBreakdown[status] ?? 0;
}

export function ReportRankingTable({
  eyebrow,
  title,
  emptyMessage,
  rows,
  timezone,
}: ReportRankingTableProps) {
  const maxTotal = rows.reduce((current, row) => Math.max(current, row.total), 0);

  return (
    <section className="surface-card p-6 sm:p-7">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-ink">
        {title}
      </h2>

      {rows.length ? (
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-line/80 text-left text-xs uppercase tracking-[0.16em] text-muted">
                <th className="pb-3 font-semibold">Nombre</th>
                <th className="pb-3 font-semibold">Total</th>
                <th className="pb-3 font-semibold">Confirmadas</th>
                <th className="pb-3 font-semibold">Pendientes</th>
                <th className="pb-3 font-semibold">Canceladas</th>
                <th className="pb-3 font-semibold">Ultima reserva</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const nameContent = (
                  <div>
                    <p className="font-semibold text-ink">{row.label}</p>
                    {row.secondaryLabel ? (
                      <p className="mt-1 text-xs text-muted">{row.secondaryLabel}</p>
                    ) : null}
                    <div className="mt-2 h-2.5 rounded-full bg-slate-100">
                      <div
                        className="h-2.5 rounded-full bg-brand-500"
                        style={{ width: getBarWidth(row.total, maxTotal) }}
                      />
                    </div>
                  </div>
                );

                return (
                  <tr key={row.id} className="border-b border-line/60 last:border-b-0">
                    <td className="py-4 pr-4">
                      {row.href ? (
                        <Link
                          href={row.href}
                          className="block transition hover:text-brand-700"
                        >
                          {nameContent}
                        </Link>
                      ) : (
                        nameContent
                      )}
                    </td>
                    <td className="py-4 pr-4 font-semibold text-ink">{row.total}</td>
                    <td className="py-4 pr-4 text-emerald-700">
                      {getStatusValue(row, AppointmentStatus.CONFIRMED)}
                    </td>
                    <td className="py-4 pr-4 text-amber-700">
                      {getStatusValue(row, AppointmentStatus.PENDING)}
                    </td>
                    <td className="py-4 pr-4 text-rose-700">
                      {getStatusValue(row, AppointmentStatus.CANCELLED)}
                    </td>
                    <td className="py-4 text-muted">
                      {row.lastReservationAt
                        ? formatDateTimeInTimeZone(row.lastReservationAt, timezone)
                        : "Sin reservas"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-6 rounded-[24px] border border-dashed border-line bg-surface-soft px-5 py-4 text-sm text-muted">
          {emptyMessage}
        </div>
      )}
    </section>
  );
}
