"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type ConfirmSubmitButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  confirmMessage: string;
  children: ReactNode;
};

export function ConfirmSubmitButton({
  confirmMessage,
  children,
  onClick,
  ...props
}: ConfirmSubmitButtonProps) {
  return (
    <button
      {...props}
      onClick={(event) => {
        if (props.disabled) {
          onClick?.(event);
          return;
        }

        if (!window.confirm(confirmMessage)) {
          event.preventDefault();
          return;
        }

        onClick?.(event);
      }}
    >
      {children}
    </button>
  );
}
