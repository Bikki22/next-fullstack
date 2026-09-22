import { NextResponse } from "next/server";

import { handleApiError } from "@/lib/api/errors";
import { requireSession } from "@/lib/auth/guards";
import { getCart } from "@/lib/cart/cart";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await requireSession();
    return NextResponse.json(await getCart(session.userId));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE() {
  try {
    const session = await requireSession();
    await prisma.cartItem.deleteMany({ where: { userId: session.userId } });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleApiError(error);
  }
}
