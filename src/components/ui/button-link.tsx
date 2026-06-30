import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type ButtonLinkProps = {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "inverted" | "ghostLight";
  className?: string;
};

const variants = {
  primary:
    "bg-brand-600 text-white shadow-soft hover:-translate-y-0.5 hover:bg-brand-700 focus-visible:ring-brand-200",
  secondary:
    "border border-line/80 bg-white/92 text-ink shadow-soft hover:-translate-y-0.5 hover:border-brand-200 hover:bg-brand-50 focus-visible:ring-brand-200",
  ghost:
    "border border-transparent bg-transparent text-ink hover:bg-white/70 focus-visible:ring-brand-200",
  inverted:
    "bg-white text-brand-700 shadow-soft hover:-translate-y-0.5 hover:bg-brand-50 focus-visible:ring-white/60",
  ghostLight:
    "border border-white/20 bg-white/10 text-white hover:bg-white/18 focus-visible:ring-white/40",
};

export function ButtonLink({
  href,
  children,
  variant = "primary",
  className,
}: ButtonLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold tracking-[-0.02em] transition-all duration-200 focus-visible:outline-none focus-visible:ring-4",
        variants[variant],
        className,
      )}
    >
      {children}
    </Link>
  );
}
