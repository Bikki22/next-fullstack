import { prisma } from "@/lib/db";
import { slugify } from "@/lib/format";

/**
 * Store slugs are public URLs, so two merchants can't share one. Falls back to
 * a numbered suffix when the name is taken: `acme`, `acme-2`, `acme-3`.
 */
export async function uniqueStoreSlug(name: string) {
  // A name of pure punctuation slugifies to an empty string.
  const base = slugify(name) || "store";

  const siblings = await prisma.store.findMany({
    where: { slug: { startsWith: base } },
    select: { slug: true },
  });

  const taken = new Set(siblings.map((store) => store.slug));
  if (!taken.has(base)) return base;

  let suffix = 2;
  while (taken.has(`${base}-${suffix}`)) suffix++;
  return `${base}-${suffix}`;
}
