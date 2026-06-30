import { NextResponse } from "next/server";

import { createAuditLog } from "@/lib/audit";
import {
  getCurrentAuthResult,
  getExpiredSessionCookie,
  revokeSessionById,
} from "@/lib/auth/session";

async function handleLogout(request: Request) {
  const authResult = await getCurrentAuthResult();

  if (authResult.status === "authenticated") {
    await createAuditLog({
      clinicId: authResult.context.clinic.id,
      userId: authResult.context.user.id,
      action: "LOGOUT",
      entityType: "SESSION",
      entityId: authResult.context.session.id,
      metadata: {
        clinicSlug: authResult.context.clinic.slug,
      },
    });

    await revokeSessionById(authResult.context.session.id);
  }

  const response = NextResponse.redirect(new URL("/login", request.url), {
    status: 303,
  });

  response.cookies.set(getExpiredSessionCookie());

  return response;
}

export async function GET(request: Request) {
  return handleLogout(request);
}

export async function POST(request: Request) {
  return handleLogout(request);
}
