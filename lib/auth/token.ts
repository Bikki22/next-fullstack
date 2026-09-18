import { SignJWT, jwtVerify } from "jose";
import { z } from "zod";

import { Role } from "@/generated/prisma/enums";
import { env } from "@/lib/env";

export const SESSION_COOKIE = "ecom_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

const sessionSchema = z.object({
  userId: z.string(),
  email: z.email(),
  name: z.string(),
  role: z.enum(Role),
});

/** The shape carried in the JWT — inferred, never hand-written twice. */
export type Session = z.infer<typeof sessionSchema>;

const secret = new TextEncoder().encode(env.AUTH_SECRET);

export function signSessionToken(session: Session) {
  return new SignJWT(session)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secret);
}

/** Safe to call from `proxy.ts`: no `next/headers`, no database. */
export async function verifySessionToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ["HS256"],
    });
    const parsed = sessionSchema.safeParse(payload);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
