"use client";

import Link from "next/link";
import { useState } from "react";

import type { DemoChecklistGroup } from "@/data/demo-checklist";
import { cn } from "@/lib/utils";

type DemoChecklistBoardProps = {
  groups: DemoChecklistGroup[];
};

function buildInitialState(groups: DemoChecklistGroup[]) {
  return Object.fromEntries(
    groups.flatMap((group) => group.items.map((item) => [item.id, false])),
  ) as Record<string, boolean>;
}

function ModuleStatusPill({
  completed,
  total,
}: {
  completed: number;
  total: number;
}) {
  const isComplete = completed === total;

  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]",
        isComplete
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-amber-200 bg-amber-50 text-amber-700",
      )}
    >
      {isComplete ? "Listo" : `${completed}/${total}`}
    </span>
  );
}

export function DemoChecklistBoard({ groups }: DemoChecklistBoardProps) {
  const [checkedItems, setCheckedItems] = useState(() => buildInitialState(groups));

  const totalItems = groups.reduce((sum, group) => sum + group.items.length, 0);
  const completedItems = Object.values(checkedItems).filter(Boolean).length;
  const completedGroups = groups.filter((group) =>
    group.items.every((item) => checkedItems[item.id]),
  ).length;
  const completionRatio = totalItems ? (completedItems / totalItems) * 100 : 0;

  function toggleItem(itemId: string) {
    setCheckedItems((current) => ({
      ...current,
      [itemId]: !current[itemId],
    }));
  }

  function resetChecklist() {
    setCheckedItems(buildInitialState(groups));
  }

  return (
    <div className="grid gap-6">
      <section className="surface-card p-6 sm:p-7">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">
              Revisión manual
            </p>
            <h2 className="mt-3 text-xl font-semibold tracking-[-0.05em] text-ink sm:text-3xl">
              Estado de demo
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
              Checklist visual sin persistencia. Se reinicia al recargar.
            </p>
          </div>

          <button
            type="button"
            onClick={resetChecklist}
            className="inline-flex w-full justify-center rounded-full border border-line/80 bg-white px-4 py-2.5 text-sm font-semibold text-ink transition hover:border-brand-200 hover:text-brand-700 sm:w-auto"
          >
            Reiniciar checklist
          </button>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-[22px] border border-line/80 bg-white/92 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
              Ítems listos
            </p>
            <p className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-brand-700">
              {completedItems}/{totalItems}
            </p>
          </article>

          <article className="rounded-[22px] border border-line/80 bg-white/92 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
              Módulos listos
            </p>
            <p className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-emerald-700">
              {completedGroups}/{groups.length}
            </p>
          </article>

          <article className="rounded-[22px] border border-line/80 bg-white/92 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
              Pendientes
            </p>
            <p className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-amber-700">
              {totalItems - completedItems}
            </p>
          </article>

          <article className="rounded-[22px] border border-line/80 bg-white/92 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
              Avance total
            </p>
            <p className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-slate-700">
              {Math.round(completionRatio)}%
            </p>
          </article>
        </div>

        <div className="mt-6 rounded-full bg-slate-100 p-1">
          <div
            className="h-3 rounded-full bg-brand-600 transition-all duration-200"
            style={{ width: `${completionRatio}%` }}
          />
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        {groups.map((group) => {
          const completed = group.items.filter((item) => checkedItems[item.id]).length;
          const isComplete = completed === group.items.length;

          return (
            <section
              key={group.id}
              className={cn(
                "surface-card p-6 sm:p-7",
                isComplete ? "border-emerald-100 bg-emerald-50/40" : "",
              )}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">
                    {group.title}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-muted">
                    {group.description}
                  </p>
                </div>

                <ModuleStatusPill completed={completed} total={group.items.length} />
              </div>

              <div className="mt-5 grid gap-3">
                {group.items.map((item) => {
                  const isChecked = checkedItems[item.id];

                  return (
                    <label
                      key={item.id}
                      className={cn(
                        "flex cursor-pointer items-start gap-3 rounded-[20px] border px-4 py-3 transition",
                        isChecked
                          ? "border-emerald-200 bg-emerald-50"
                          : "border-line/80 bg-white hover:border-brand-200 hover:bg-brand-50/40",
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleItem(item.id)}
                        className="mt-0.5 h-4 w-4 rounded border-line text-brand-600"
                      />
                      <span
                        className={cn(
                          "text-sm font-medium leading-6",
                          isChecked ? "text-emerald-900" : "text-ink",
                        )}
                      >
                        {item.label}
                      </span>
                    </label>
                  );
                })}
              </div>

              {group.actionHref && group.actionLabel ? (
                <div className="mt-5">
                  <Link
                    href={group.actionHref}
                    className="inline-flex w-full justify-center rounded-full border border-line/80 bg-white px-4 py-2.5 text-sm font-semibold text-ink transition hover:border-brand-200 hover:text-brand-700 sm:w-auto"
                  >
                    {group.actionLabel}
                  </Link>
                </div>
              ) : null}
            </section>
          );
        })}
      </div>
    </div>
  );
}
