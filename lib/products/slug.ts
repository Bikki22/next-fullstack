import { prisma } from "@/lib/db";
import { slugify } from "@/lib/format";

/**
 * Product slugs are unique per store, not globally — see the `@@unique` on the
 * model. Falls back to a numbered suffix within the store: `blue-shirt`,
 * `blue-shirt-2`. Pass `excludeProductId` when renaming, so a product doesn't
 * collide with its own current slug.
 */
export async function uniqueProductSlug(
  storeId: string,
  name: string,
  excludeProductId?: string,
) {
  // A name of pure punctuation slugifies to an empty string.
  const base = slugify(name) || "product";

  const siblings = await prisma.product.findMany({
    where: {
      storeId,
      slug: { startsWith: base },
      ...(excludeProductId ? { id: { not: excludeProductId } } : {}),
    },
    select: { slug: true },
  });

  const taken = new Set(siblings.map((product) => product.slug));
  if (!taken.has(base)) return base;

  let suffix = 2;
  while (taken.has(`${base}-${suffix}`)) suffix++;
  return `${base}-${suffix}`;
}
