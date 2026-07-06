import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type CollapsibleDetailsProps = {
  summary: string;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
  summaryClassName?: string;
  contentClassName?: string;
};

export function CollapsibleDetails({
  summary,
  children,
  defaultOpen = false,
  className,
  summaryClassName,
  contentClassName,
}: CollapsibleDetailsProps) {
  return (
    <details
      open={defaultOpen}
      className={cn(
        "rounded-[20px] border border-line/80 bg-surface-soft px-4 py-4",
        className,
      )}
    >
      <summary
        className={cn(
          "cursor-pointer list-none text-sm font-semibold text-ink [&::-webkit-details-marker]:hidden",
          summaryClassName,
        )}
      >
        {summary}
      </summary>
      <div className={cn("mt-4", contentClassName)}>{children}</div>
    </details>
  );
}
