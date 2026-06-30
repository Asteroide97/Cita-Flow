import type { InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type TextInputProps = InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean;
};

export function TextInput({ className, invalid = false, ...props }: TextInputProps) {
  return (
    <input
      className={cn(
        "w-full rounded-[22px] border border-line/80 bg-white/95 px-4 py-3.5 text-sm text-ink shadow-[0_12px_30px_-24px_rgba(15,23,42,0.28)] outline-none transition placeholder:text-slate-400 focus:border-brand-200 focus:ring-4 focus:ring-brand-100/80",
        invalid && "border-rose-200 focus:border-rose-300 focus:ring-rose-100",
        className,
      )}
      {...props}
    />
  );
}
