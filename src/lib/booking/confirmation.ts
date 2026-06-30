import { cookies } from "next/headers";

import type { BookingConfirmationData } from "@/types/booking";

export const PUBLIC_BOOKING_CONFIRMATION_COOKIE_NAME =
  "citaflow_public_booking";

function buildCookieOptions() {
  return {
    name: PUBLIC_BOOKING_CONFIRMATION_COOKIE_NAME,
    httpOnly: true as const,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 30 * 60,
  };
}

export async function setPublicBookingConfirmationCookie(
  payload: BookingConfirmationData,
) {
  const cookieStore = await cookies();

  cookieStore.set({
    ...buildCookieOptions(),
    value: JSON.stringify(payload),
  });
}

export async function readPublicBookingConfirmationCookie(clinicSlug: string) {
  const cookieStore = await cookies();
  const rawValue = cookieStore.get(PUBLIC_BOOKING_CONFIRMATION_COOKIE_NAME)?.value;

  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue) as BookingConfirmationData;

    if (parsed.clinicSlug !== clinicSlug) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}
