"use client";

import type { ReactNode } from "react";
import { createPortal } from "react-dom";

type NotificationDrawerPortalProps = {
  children: ReactNode;
};

export function NotificationDrawerPortal({
  children,
}: NotificationDrawerPortalProps) {
  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(children, document.body);
}
