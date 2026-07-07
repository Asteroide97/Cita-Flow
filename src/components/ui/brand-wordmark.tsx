import { brand } from "@/lib/brand";
import { cn } from "@/lib/utils";

type BrandWordmarkProps = {
  className?: string;
  accentClassName?: string;
};

export function BrandWordmark({
  className,
  accentClassName = "text-brand-600",
}: BrandWordmarkProps) {
  const [lead, ...rest] = brand.name.split(" ");
  const trailing = rest.join(" ");

  if (!trailing) {
    return <span className={className}>{brand.name}</span>;
  }

  return (
    <span className={cn("inline-flex items-center gap-2 whitespace-nowrap", className)}>
      <span>{lead}</span>
      <span className={accentClassName}>{trailing}</span>
    </span>
  );
}
