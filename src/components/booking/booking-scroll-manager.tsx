"use client";

import { useEffect } from "react";

import type { BookingStepAnchor } from "@/types/booking";

type BookingScrollManagerProps = {
  focusTarget?: BookingStepAnchor | null;
};

export function BookingScrollManager({
  focusTarget,
}: BookingScrollManagerProps) {
  useEffect(() => {
    if (!focusTarget) {
      return;
    }

    const target = document.getElementById(focusTarget);

    if (!target) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      target.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      if (typeof target.focus === "function") {
        target.focus({ preventScroll: true });
      }
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [focusTarget]);

  return null;
}
