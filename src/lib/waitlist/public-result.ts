import { cookies } from "next/headers";

import { hashWaitlistOfferToken } from "@/lib/waitlist/tokens";

export type PublicWaitlistOfferResultPayload = {
  tokenHash: string;
  action: "accept" | "reject";
  clinicName: string;
  clinicSlug: string;
  brandColor: string | null;
  patientName: string;
  phoneE164: string;
  email: string | null;
  doctorName: string;
  doctorSpecialty: string | null;
  serviceName: string;
  offeredStartAtIso: string;
  offeredEndAtIso: string;
  timezone: string;
  statusLabel: string;
  message: string;
};

const PUBLIC_WAITLIST_RESULT_COOKIE_NAME = "citaflow_public_waitlist_result";

function buildCookieOptions() {
  return {
    name: PUBLIC_WAITLIST_RESULT_COOKIE_NAME,
    httpOnly: true as const,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 30 * 60,
  };
}

export async function setPublicWaitlistOfferResultCookie(
  payload: Omit<PublicWaitlistOfferResultPayload, "tokenHash"> & {
    token: string;
  },
) {
  const cookieStore = await cookies();
  const { token, ...serializablePayload } = payload;

  cookieStore.set({
    ...buildCookieOptions(),
    value: JSON.stringify({
      ...serializablePayload,
      tokenHash: hashWaitlistOfferToken(token),
    } satisfies PublicWaitlistOfferResultPayload),
  });
}

export async function readPublicWaitlistOfferResultCookie(params: {
  token: string;
  action: PublicWaitlistOfferResultPayload["action"];
}) {
  const cookieStore = await cookies();
  const rawValue = cookieStore.get(PUBLIC_WAITLIST_RESULT_COOKIE_NAME)?.value;

  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue) as PublicWaitlistOfferResultPayload;

    if (
      parsed.tokenHash !== hashWaitlistOfferToken(params.token) ||
      parsed.action !== params.action
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}
