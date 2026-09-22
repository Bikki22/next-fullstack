import { ProductStatus, StoreStatus } from "@/generated/prisma/enums";
import { conflict, notFound } from "@/lib/api/errors";
import { prisma } from "@/lib/db";

/** The user's cart, priced from the live product rows. */
export async function getCart(userId: string) {
  const items = await prisma.cartItem.findMany({
    where: { userId },
    select: {
      id: true,
      quantity: true,
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          priceCents: true,
          stock: true,
          images: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const subtotalCents = items.reduce(
    (sum, item) => sum + item.product.priceCents * item.quantity,
    0,
  );

  return { items, subtotalCents };
}

/** Throws unless the product is on sale and has `quantity` in stock. */
export async function requireStock(productId: string, quantity: number) {
  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      status: ProductStatus.ACTIVE,
      store: { status: StoreStatus.APPROVED },
    },
    select: { stock: true },
  });
  if (!product) throw notFound("Product not found");
  if (product.stock < quantity) {
    throw conflict(`Only ${product.stock} left in stock`);
  }
}
