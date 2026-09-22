import { NextResponse, type NextRequest } from "next/server";

import { ProductStatus, Role, StoreStatus } from "@/generated/prisma/enums";
import type { ProductWhereInput } from "@/generated/prisma/models";
import { badRequest, handleApiError, notFound } from "@/lib/api/errors";
import { requireStore } from "@/lib/auth/guards";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { productSelect } from "@/lib/products/select";
import { uniqueProductSlug } from "@/lib/products/slug";
import { updateProductSchema } from "@/lib/validations/product";

type Context = RouteContext<"/api/products/[productId]">;

export async function GET(_request: NextRequest, context: Context) {
  try {
    const { productId } = await context.params;
    const session = await getSession();

    // Shoppers see live products from approved stores; a seller also sees
    // their own drafts, and a super admin sees everything. Anything else is a
    // 404 rather than a 403 — no hinting at products you may not look at.
    const where: ProductWhereInput =
      session?.role === Role.SUPER_ADMIN
        ? { id: productId }
        : {
            id: productId,
            OR: [
              {
                status: ProductStatus.ACTIVE,
                store: { status: StoreStatus.APPROVED },
              },
              ...(session ? [{ store: { ownerId: session.userId } }] : []),
            ],
          };

    const product = await prisma.product.findFirst({
      where,
      select: productSelect,
    });
    if (!product) throw notFound("Product not found");

    return NextResponse.json({ product });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, context: Context) {
  try {
    const { productId } = await context.params;
    const { store } = await requireStore();
    const input = updateProductSchema.parse(await request.json());

    const existing = await prisma.product.findFirst({
      where: { id: productId, storeId: store.id },
      select: { id: true, name: true },
    });
    if (!existing) throw notFound("Product not found");

    if (input.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: input.categoryId },
        select: { id: true },
      });
      if (!category) throw badRequest("Unknown category");
    }

    const product = await prisma.product.update({
      where: { id: existing.id },
      data: {
        ...input,
        // A rename moves the public URL with it; the old slug is not kept.
        ...(input.name && input.name !== existing.name
          ? { slug: await uniqueProductSlug(store.id, input.name, existing.id) }
          : {}),
      },
      select: productSelect,
    });

    return NextResponse.json({ product });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: NextRequest, context: Context) {
  try {
    const { productId } = await context.params;
    const { store } = await requireStore();

    const existing = await prisma.product.findFirst({
      where: { id: productId, storeId: store.id },
      select: { id: true },
    });
    if (!existing) throw notFound("Product not found");

    await prisma.product.delete({ where: { id: existing.id } });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleApiError(error);
  }
}
