import { NextResponse, type NextRequest } from "next/server";

import { handleApiError } from "@/lib/api/errors";
import { requireSession } from "@/lib/auth/guards";
import { getCart, requireStock } from "@/lib/cart/cart";
import { prisma } from "@/lib/db";
import { addCartItemSchema } from "@/lib/validations/cart";

// Adds a product, or bumps its quantity if it is already in the cart.
export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    const { productId, quantity } = addCartItemSchema.parse(
      await request.json(),
    );
    const where = { userId_productId: { userId: session.userId, productId } };

    const existing = await prisma.cartItem.findUnique({
      where,
      select: { quantity: true },
    });
    const total = (existing?.quantity ?? 0) + quantity;

    await requireStock(productId, total);

    await prisma.cartItem.upsert({
      where,
      create: { userId: session.userId, productId, quantity: total },
      update: { quantity: total },
    });

    return NextResponse.json(await getCart(session.userId), { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
