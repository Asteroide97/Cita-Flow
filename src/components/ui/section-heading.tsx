import { cn } from "@/lib/utils";

type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
}: SectionHeadingProps) {
  const centered = align === "center";

  return (
    <div className={cn("max-w-3xl", centered && "mx-auto text-center")}>
      {eyebrow ? (
        <p className="mb-5 text-xs font-semibold uppercase tracking-[0.28em] text-brand-600 sm:text-sm">
          {eyebrow}
        </p>
      ) : null}

      <h2 className="text-balance text-3xl font-semibold tracking-[-0.06em] text-ink sm:text-4xl lg:text-[3.35rem] lg:leading-[1.05]">
        {title}
      </h2>

      {description ? (
        <p className="mt-6 text-base leading-8 text-muted sm:text-lg">{description}</p>
      ) : null}
    </div>
  );
}
