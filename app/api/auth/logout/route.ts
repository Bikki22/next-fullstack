import { NextResponse } from "next/server";

import { handleApiError } from "@/lib/api/errors";
import { destroySession } from "@/lib/auth/session";

// Clearing a cookie the visitor never had is not an error, so this stays
// idempotent: always 204, signed in or not.
export async function POST() {
  try {
    await destroySession();
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleApiError(error);
  }
}
