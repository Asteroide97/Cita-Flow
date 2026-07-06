import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type StatusPillProps = {
  children: ReactNode;
  className?: string;
};

export function StatusPill({ children, className }: StatusPillProps) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]",
        className,
      )}
    >
      {children}
    </span>
  );
}
