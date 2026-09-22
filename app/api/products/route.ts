import { NextResponse, type NextRequest } from "next/server";

import { ProductStatus, StoreStatus } from "@/generated/prisma/enums";
import type {
  ProductOrderByWithRelationInput,
  ProductWhereInput,
} from "@/generated/prisma/models";
import { badRequest, handleApiError } from "@/lib/api/errors";
import { requireStore } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { productSelect } from "@/lib/products/select";
import { uniqueProductSlug } from "@/lib/products/slug";
import {
  createProductSchema,
  productQuerySchema,
} from "@/lib/validations/product";

const ORDER_BY: Record<string, ProductOrderByWithRelationInput> = {
  newest: { createdAt: "desc" },
  oldest: { createdAt: "asc" },
  price_asc: { priceCents: "asc" },
  price_desc: { priceCents: "desc" },
};

export async function GET(request: NextRequest) {
  try {
    const query = productQuerySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams),
    );

    const where: ProductWhereInput = {
      ...(query.q
        ? {
            OR: [
              { name: { contains: query.q, mode: "insensitive" } },
              { description: { contains: query.q, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(query.category ? { category: { slug: query.category } } : {}),
      ...(query.minPrice !== undefined || query.maxPrice !== undefined
        ? { priceCents: { gte: query.minPrice, lte: query.maxPrice } }
        : {}),
    };

    if (query.mine) {
      // The seller's own inventory: drafts and archived rows included, and
      // never anyone else's products, whatever `store` was asked for.
      const { store } = await requireStore();
      where.storeId = store.id;
      if (query.status) where.status = query.status;
    } else {
      // The public catalog. A product is only shoppable when the seller set it
      // live *and* an admin approved the store behind it.
      where.status = ProductStatus.ACTIVE;
      where.store = {
        status: StoreStatus.APPROVED,
        ...(query.store ? { slug: query.store } : {}),
      };
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        select: productSelect,
        orderBy: ORDER_BY[query.sort],
        skip: (query.page - 1) * query.perPage,
        take: query.perPage,
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({
      products,
      page: query.page,
      perPage: query.perPage,
      total,
      totalPages: Math.ceil(total / query.perPage),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { store } = await requireStore();
    const input = createProductSchema.parse(await request.json());

    if (input.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: input.categoryId },
        select: { id: true },
      });
      if (!category) throw badRequest("Unknown category");
    }

    // A pending store may stock its shelves; `GET` keeps the products hidden
    // until an admin approves the store, so there is nothing to gate here.
    const product = await prisma.product.create({
      data: {
        storeId: store.id,
        name: input.name,
        slug: await uniqueProductSlug(store.id, input.name),
        description: input.description,
        priceCents: input.priceCents,
        stock: input.stock,
        images: input.images,
        status: input.status,
        categoryId: input.categoryId,
      },
      select: productSelect,
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
