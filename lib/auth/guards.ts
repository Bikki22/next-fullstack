import { forbidden, unauthorized } from "@/lib/api/errors";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { Role, StoreStatus } from "@/generated/prisma/enums";

/** Throws 401 unless a session cookie is present and valid. */
export async function requireSession() {
  const session = await getSession();
  if (!session) throw unauthorized();
  return session;
}

/** Throws 403 unless the signed-in user holds one of `roles`. */
export async function requireRole(...roles: Role[]) {
  const session = await requireSession();
  if (!roles.includes(session.role)) throw forbidden();
  return session;
}

/**
 * Resolves the store owned by the signed-in merchant. Super admins are allowed
 * through every merchant guard, so they can act on any store by id.
 */
export async function requireStore() {
  const session = await requireRole(Role.MERCHANT, Role.SUPER_ADMIN);

  const store = await prisma.store.findUnique({
    where: { ownerId: session.userId },
    select: { id: true, name: true, slug: true, status: true },
  });

  if (!store) throw forbidden("Create a store before managing products");
  if (store.status === StoreStatus.SUSPENDED) {
    throw forbidden("Your store is suspended. Contact support.");
  }

  return { session, store };
}
