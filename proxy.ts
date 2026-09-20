import { NextResponse, type NextRequest } from "next/server";

import { Role } from "@/generated/prisma/enums";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/token";

/**
 * Page prefixes that need a session, and the roles allowed through each.
 * `null` means any signed-in user will do.
 */
const PROTECTED: Array<[prefix: string, roles: Role[] | null]> = [
  ["/account", null],
  ["/checkout", null],
  ["/dashboard", [Role.MERCHANT, Role.SUPER_ADMIN]],
  ["/admin", [Role.SUPER_ADMIN]],
];

/** Signed-in visitors get bounced off these. */
const AUTH_PAGES = ["/login", "/register"];

const matches = (pathname: string, prefix: string) =>
  pathname === prefix || pathname.startsWith(`${prefix}/`);

/**
 * An *optimistic* gate: it only reads the signed cookie, never the database,
 * because it runs on every navigation including prefetches. It exists to keep
 * anonymous visitors out of pages that would only redirect them anyway — the
 * real enforcement lives beside the data, in `lib/auth/guards.ts`.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (session && AUTH_PAGES.some((page) => matches(pathname, page))) {
    return NextResponse.redirect(new URL("/", request.nextUrl));
  }

  const guard = PROTECTED.find(([prefix]) => matches(pathname, prefix));
  if (!guard) return NextResponse.next();

  if (!session) {
    const login = new URL("/login", request.nextUrl);
    // So the login page can send them back where they were headed.
    login.searchParams.set("next", pathname + request.nextUrl.search);
    return NextResponse.redirect(login);
  }

  const [, roles] = guard;
  if (roles && !roles.includes(session.role)) {
    return NextResponse.redirect(new URL("/", request.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  // `/api/*` is left out on purpose: those routes answer with a JSON 401 from
  // the guards, and redirecting a fetch to an HTML login page would hide that.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
