import { Role, StoreStatus } from "@/generated/prisma/enums";
import { conflict } from "@/lib/api/errors";
import { parseBody, route } from "@/lib/api/route";
import { hashPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/format";
import { registerSchema } from "@/lib/validations/auth";

export const POST = route(async (request) => {
  const input = await parseBody(request, registerSchema);
  const email = input.email.toLowerCase();

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (existing) throw conflict("That email is already registered");

  const user = await prisma.user.create({
    data: {
      email,
      name: input.name,
      passwordHash: await hashPassword(input.password),
      role: input.role,
      ...(input.role === Role.MERCHANT && input.storeName
        ? {
            store: {
              create: {
                name: input.storeName,
                // slug: await uniqueStoreSlug(input.storeName),
                // New sellers start pending; a super admin approves them.
                status: StoreStatus.PENDING,
              },
            },
          }
        : {}),
    },
    select: { id: true, email: true, name: true, role: true },
  });

  await createSession({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });

  return { user };
});
