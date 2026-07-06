import { cn } from "@/lib/utils";

type EmptyStateProps = {
  title: string;
  description?: string;
  className?: string;
};

export function EmptyState({
  title,
  description,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "rounded-[24px] border border-dashed border-line bg-surface-soft px-5 py-4 text-sm text-muted",
        className,
      )}
    >
      <p className="font-semibold text-ink">{title}</p>
      {description ? <p className="mt-2 leading-6">{description}</p> : null}
    </div>
  );
}
