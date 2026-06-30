import type { InputHTMLAttributes } from "react";

import { TextInput } from "@/components/ui/text-input";

type AuthFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & {
  label: string;
  error?: string;
  hint?: string;
};

export function AuthField({
  label,
  error,
  hint,
  id,
  name,
  className,
  ...props
}: AuthFieldProps) {
  const fieldId = id ?? name ?? label.toLowerCase().replace(/\s+/g, "-");
  const errorId = error ? `${fieldId}-error` : undefined;
  const hintId = hint ? `${fieldId}-hint` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <label className="block">
      <span className="mb-2.5 block text-sm font-semibold text-ink">{label}</span>
      <TextInput
        id={fieldId}
        name={name}
        className={className}
        invalid={Boolean(error)}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        {...props}
      />

      {hint ? (
        <p id={hintId} className="mt-2 text-xs leading-6 text-muted">
          {hint}
        </p>
      ) : null}

      {error ? (
        <p id={errorId} className="mt-2 text-sm font-medium text-rose-600">
          {error}
        </p>
      ) : null}
    </label>
  );
}
