import { cookies } from "next/headers";

import { env } from "@/lib/env";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  signSessionToken,
  verifySessionToken,
  type Session,
} from "@/lib/auth/token";

export { SESSION_COOKIE, type Session };

export async function createSession(session: Session) {
  const store = await cookies();
  store.set(SESSION_COOKIE, await signSessionToken(session), {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function destroySession() {
  (await cookies()).delete(SESSION_COOKIE);
}

/** Returns the signed-in user, or `null` for anonymous visitors. */
export async function getSession() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return token ? verifySessionToken(token) : null;
}
