import { Role } from "@/generated/prisma/enums";
import { notFound } from "@/lib/api/errors";
import { parseBody, route } from "@/lib/api/route";
import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { storeSchema } from "@/lib/validations/store";

export const GET = route(async () => {
  const session = await requireRole(Role.MERCHANT, Role.SUPER_ADMIN);
  const store = await prisma.store.findUnique({
    where: { ownerId: session.userId },
    include: { _count: { select: { products: true, orders: true } } },
  });
  if (!store) throw notFound("You do not have a store yet");
  return store;
});

export const PATCH = route(async (request) => {
  const session = await requireRole(Role.MERCHANT, Role.SUPER_ADMIN);
  const input = await parseBody(request, storeSchema);

  return prisma.store.update({
    where: { ownerId: session.userId },
    data: {
      name: input.name,
      description: input.description || null,
      supportEmail: input.supportEmail || null,
      logoUrl: input.logoUrl || null,
      bannerUrl: input.bannerUrl || null,
    },
  });
});
