import { cookies } from "next/headers";

import { hashAppointmentToken } from "@/lib/appointments/tokens";

export type PublicAppointmentResultPayload = {
  tokenHash: string;
  action: "confirm" | "cancel" | "reschedule";
  clinicName: string;
  clinicSlug: string;
  brandColor: string | null;
  patientName: string;
  phoneE164: string;
  email: string | null;
  doctorName: string;
  doctorSpecialty: string | null;
  serviceName: string;
  startAtIso: string;
  endAtIso: string;
  timezone: string;
  statusLabel: string;
  message: string;
};

const PUBLIC_APPOINTMENT_RESULT_COOKIE_NAME = "citaflow_public_appointment_result";

function buildCookieOptions() {
  return {
    name: PUBLIC_APPOINTMENT_RESULT_COOKIE_NAME,
    httpOnly: true as const,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 30 * 60,
  };
}

export async function setPublicAppointmentResultCookie(
  payload: Omit<PublicAppointmentResultPayload, "tokenHash"> & {
    token: string;
  },
) {
  const cookieStore = await cookies();
  const { token, ...serializablePayload } = payload;

  cookieStore.set({
    ...buildCookieOptions(),
    value: JSON.stringify({
      ...serializablePayload,
      tokenHash: hashAppointmentToken(token),
    } satisfies PublicAppointmentResultPayload),
  });
}

export async function readPublicAppointmentResultCookie(params: {
  token: string;
  action: PublicAppointmentResultPayload["action"];
}) {
  const cookieStore = await cookies();
  const rawValue = cookieStore.get(PUBLIC_APPOINTMENT_RESULT_COOKIE_NAME)?.value;

  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue) as PublicAppointmentResultPayload;

    if (
      parsed.tokenHash !== hashAppointmentToken(params.token) ||
      parsed.action !== params.action
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}
