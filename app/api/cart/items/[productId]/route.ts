import { NextResponse, type NextRequest } from "next/server";

import { handleApiError, notFound } from "@/lib/api/errors";
import { requireSession } from "@/lib/auth/guards";
import { getCart, requireStock } from "@/lib/cart/cart";
import { prisma } from "@/lib/db";
import { updateCartItemSchema } from "@/lib/validations/cart";

type Context = RouteContext<"/api/cart/items/[productId]">;

export async function PATCH(request: NextRequest, context: Context) {
  try {
    const { productId } = await context.params;
    const session = await requireSession();
    const { quantity } = updateCartItemSchema.parse(await request.json());
    const where = { userId_productId: { userId: session.userId, productId } };

    const existing = await prisma.cartItem.findUnique({
      where,
      select: { id: true },
    });
    if (!existing) throw notFound("That product is not in your cart");

    await requireStock(productId, quantity);
    await prisma.cartItem.update({ where, data: { quantity } });

    return NextResponse.json(await getCart(session.userId));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: NextRequest, context: Context) {
  try {
    const { productId } = await context.params;
    const session = await requireSession();

    await prisma.cartItem.deleteMany({
      where: { userId: session.userId, productId },
    });

    return NextResponse.json(await getCart(session.userId));
  } catch (error) {
    return handleApiError(error);
  }
}
