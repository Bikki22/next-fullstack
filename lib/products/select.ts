/**
 * One shape for every product the API returns, so a client written against the
 * list can read a single product without a second parser. `storeId` and
 * `categoryId` stay out — the nested objects carry them.
 */
export const productSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  priceCents: true,
  stock: true,
  images: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  store: { select: { id: true, name: true, slug: true } },
  category: { select: { id: true, name: true, slug: true } },
} as const;
